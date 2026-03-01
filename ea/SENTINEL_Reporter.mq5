//+------------------------------------------------------------------+
//|                                          SENTINEL_Reporter.mq5   |
//|                         SENTINEL MT5 Dashboard Reporter EA       |
//|  ส่งข้อมูล account + orders มายัง SENTINEL backend ทุก N วินาที  |
//+------------------------------------------------------------------+
#property copyright "SENTINEL"
#property version   "1.20"
#property strict

#include <Trade/Trade.mqh>

//--- Input Parameters
input string   InpApiKey        = "YOUR_API_KEY_HERE";   // API Key (จากหน้า Dashboard)
input string   InpServerUrl     = "http://127.0.0.1:4000/api/mt5/push"; // URL Backend
input int      InpIntervalSec   = 2;                      // ส่งข้อมูลทุกกี่วินาที (แนะนำ 2)
input string   InpBotName       = "";                     // ชื่อ bot (ถ้าว่างใช้ชื่อ account)

//--- Global Variables
datetime g_lastSend = 0;
int      g_errorCount = 0;
CTrade   g_trade;

//+------------------------------------------------------------------+
// Escape special characters for JSON string values
//+------------------------------------------------------------------+
string JsonEscape(string text)
{
   string result = text;
   StringReplace(result, "\\", "\\\\");
   StringReplace(result, "\"", "\\\"");
   StringReplace(result, "\n", "\\n");
   StringReplace(result, "\r", "\\r");
   StringReplace(result, "\t", "\\t");
   return result;
}

//+------------------------------------------------------------------+
int OnInit()
{
   if(InpApiKey == "YOUR_API_KEY_HERE" || InpApiKey == "") {
      Alert("SENTINEL: กรุณาตั้งค่า API Key ก่อนใช้งาน");
      return INIT_PARAMETERS_INCORRECT;
   }
   if(InpServerUrl == "" || StringFind(InpServerUrl, "http") < 0) {
      Alert("SENTINEL: กรุณาตั้งค่า Server URL ให้ถูกต้อง");
      return INIT_PARAMETERS_INCORRECT;
   }

   // Use OnTimer as primary sender (works even when market is closed)
   EventSetTimer(InpIntervalSec);

   Print("SENTINEL Reporter v1.20 started | Account: ", AccountInfoInteger(ACCOUNT_LOGIN),
         " | Server: ", AccountInfoString(ACCOUNT_SERVER),
         " | Interval: ", InpIntervalSec, "s");
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("SENTINEL Reporter stopped (reason: ", reason, ")");
}

//+------------------------------------------------------------------+
// OnTimer — primary data sender (works 24/7 including weekends)
//+------------------------------------------------------------------+
void OnTimer()
{
   SendSnapshot();
}

//+------------------------------------------------------------------+
// OnTick — also sends on tick for lowest latency during market hours
//+------------------------------------------------------------------+
void OnTick()
{
   datetime now = TimeCurrent();
   if(now - g_lastSend < InpIntervalSec) return;
   SendSnapshot();
}

//+------------------------------------------------------------------+
// Parse response and execute commands if present
//+------------------------------------------------------------------+
void ProcessResponse(char &resultData[])
{
   string response = CharArrayToString(resultData);

   // Quick check: does response contain commands?
   if(StringFind(response, "\"commands\"") < 0) return;

   // Check for CLOSE_ALL command
   if(StringFind(response, "CLOSE_ALL") >= 0) {
      Print("SENTINEL: >>> CLOSE_ALL command received from dashboard <<<");
      ExecuteCloseAll();
   }
}

//+------------------------------------------------------------------+
// Close all open positions and delete all pending orders
//+------------------------------------------------------------------+
void ExecuteCloseAll()
{
   int closed = 0;
   int errors = 0;

   // Phase 1: Close all open positions (iterate in reverse)
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;

      if(g_trade.PositionClose(ticket)) {
         closed++;
         Print("SENTINEL: Closed position #", ticket);
      } else {
         errors++;
         Print("SENTINEL: Failed to close #", ticket, " error=", GetLastError());
      }
   }

   // Phase 2: Delete all pending orders
   int deleted = 0;
   for(int i = OrdersTotal() - 1; i >= 0; i--) {
      ulong ticket = OrderGetTicket(i);
      if(ticket == 0) continue;

      if(g_trade.OrderDelete(ticket)) {
         deleted++;
         Print("SENTINEL: Deleted pending #", ticket);
      } else {
         errors++;
         Print("SENTINEL: Failed to delete pending #", ticket, " error=", GetLastError());
      }
   }

   Print("SENTINEL: CloseAll complete — closed: ", closed,
         ", deleted pending: ", deleted, ", errors: ", errors);
}

//+------------------------------------------------------------------+
// Build JSON and send to backend
//+------------------------------------------------------------------+
void SendSnapshot()
{
   // Throttle: don't send more frequently than interval
   datetime now = TimeLocal(); // Use local time for throttle (works even if server time is stale)
   if(now - g_lastSend < InpIntervalSec) return;
   g_lastSend = now;

   string botName = InpBotName != "" ? InpBotName : AccountInfoString(ACCOUNT_NAME);

   // Account info
   double balance    = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity     = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin     = AccountInfoDouble(ACCOUNT_MARGIN);
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double marginLvl  = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   double profit     = AccountInfoDouble(ACCOUNT_PROFIT);
   long   accLogin   = AccountInfoInteger(ACCOUNT_LOGIN);
   string broker     = AccountInfoString(ACCOUNT_COMPANY);
   string server     = AccountInfoString(ACCOUNT_SERVER);
   string currency   = AccountInfoString(ACCOUNT_CURRENCY);
   long   leverage   = AccountInfoInteger(ACCOUNT_LEVERAGE);

   // Build orders JSON array
   string ordersJson = "[";
   int totalPos = PositionsTotal();
   int orderCount = 0;
   for(int i = 0; i < totalPos; i++) {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(!PositionSelectByTicket(ticket)) continue;

      string sym       = PositionGetString(POSITION_SYMBOL);
      int    posType   = (int)PositionGetInteger(POSITION_TYPE); // 0=BUY,1=SELL
      double lots      = PositionGetDouble(POSITION_VOLUME);
      double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      double curPrice  = PositionGetDouble(POSITION_PRICE_CURRENT);
      double posProfit = PositionGetDouble(POSITION_PROFIT);
      double sl        = PositionGetDouble(POSITION_SL);
      double tp        = PositionGetDouble(POSITION_TP);
      datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);

      if(orderCount > 0) ordersJson += ",";
      ordersJson += StringFormat(
         "{\"ticket\":%I64u,\"symbol\":\"%s\",\"type\":%d,\"lots\":%.2f,"
         "\"openPrice\":%.5f,\"currentPrice\":%.5f,\"profit\":%.2f,"
         "\"openTime\":\"%s\",\"sl\":%.5f,\"tp\":%.5f}",
         ticket, JsonEscape(sym), posType, lots,
         openPrice, curPrice, posProfit,
         TimeToString(openTime, TIME_DATE|TIME_MINUTES|TIME_SECONDS),
         sl, tp
      );
      orderCount++;
   }
   ordersJson += "]";

   // Build pending orders JSON array
   string pendingJson = "[";
   int totalOrders = OrdersTotal();
   int pendingCount = 0;
   for(int i = 0; i < totalOrders; i++) {
      ulong ticket = OrderGetTicket(i);
      if(ticket == 0) continue;
      if(!OrderSelect(ticket)) continue;

      string sym       = OrderGetString(ORDER_SYMBOL);
      int    ordType   = (int)OrderGetInteger(ORDER_TYPE); // 2-7
      double lots      = OrderGetDouble(ORDER_VOLUME_CURRENT);
      double price     = OrderGetDouble(ORDER_PRICE_OPEN);
      double sl        = OrderGetDouble(ORDER_SL);
      double tp        = OrderGetDouble(ORDER_TP);
      datetime expTime = (datetime)OrderGetInteger(ORDER_TIME_EXPIRATION);

      string expStr = expTime > 0
         ? TimeToString(expTime, TIME_DATE|TIME_MINUTES|TIME_SECONDS)
         : "";

      if(pendingCount > 0) pendingJson += ",";
      pendingJson += StringFormat(
         "{\"ticket\":%I64u,\"symbol\":\"%s\",\"type\":%d,\"lots\":%.2f,"
         "\"openPrice\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"expiration\":\"%s\"}",
         ticket, JsonEscape(sym), ordType, lots, price, sl, tp, expStr
      );
      pendingCount++;
   }
   pendingJson += "]";

   // Build full JSON payload
   string json = StringFormat(
      "{"
      "\"apiKey\":\"%s\","
      "\"accountNumber\":\"%I64d\","
      "\"name\":\"%s\","
      "\"broker\":\"%s\","
      "\"server\":\"%s\","
      "\"currency\":\"%s\","
      "\"leverage\":%I64d,"
      "\"balance\":%.2f,"
      "\"equity\":%.2f,"
      "\"margin\":%.2f,"
      "\"freeMargin\":%.2f,"
      "\"marginLevel\":%.2f,"
      "\"profit\":%.2f,"
      "\"orders\":%s,"
      "\"pending\":%s"
      "}",
      JsonEscape(InpApiKey),
      accLogin,
      JsonEscape(botName),
      JsonEscape(broker),
      JsonEscape(server),
      JsonEscape(currency),
      leverage,
      balance, equity, margin, freeMargin, marginLvl, profit,
      ordersJson,
      pendingJson
   );

   // Send via WebRequest
   string headers = "Content-Type: application/json\r\n";
   char   postData[];
   char   resultData[];
   string resultHeaders;

   StringToCharArray(json, postData, 0, StringLen(json));

   int timeout = 5000; // 5 seconds
   int httpCode = WebRequest(
      "POST",
      InpServerUrl,
      headers,
      timeout,
      postData,
      resultData,
      resultHeaders
   );

   if(httpCode == 200) {
      if(g_errorCount > 0) {
         Print("SENTINEL: Connection restored! (after ", g_errorCount, " errors)");
         g_errorCount = 0;
      }
      // Check for commands in response
      ProcessResponse(resultData);
   } else if(httpCode == -1) {
      g_errorCount++;
      if(g_errorCount <= 3 || g_errorCount % 30 == 0) {
         Print("SENTINEL: WebRequest error #", g_errorCount,
               " — URL ไม่ได้ถูก allow? ไปที่ Tools > Options > Expert Advisors > Allow WebRequest for listed URL");
         Print("  เพิ่ม URL: ", InpServerUrl);
      }
   } else {
      g_errorCount++;
      string response = CharArrayToString(resultData);
      if(g_errorCount <= 5 || g_errorCount % 30 == 0) {
         Print("SENTINEL: HTTP ", httpCode, " | ", response, " (error #", g_errorCount, ")");
      }
   }
}
//+------------------------------------------------------------------+
