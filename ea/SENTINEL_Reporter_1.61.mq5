//+------------------------------------------------------------------+
//|                                          SENTINEL_Reporter.mq5   |
//|                         SENTINEL MT5 Dashboard Reporter EA       |
//|  ส่งข้อมูล account + orders มายัง SENTINEL backend ทุก N วินาที  |
//+------------------------------------------------------------------+
#property copyright "SENTINEL"
#property version   "1.61"
#property strict

#include <Trade/Trade.mqh>

//--- Input Parameters
input string   InpApiKey        = "YOUR_API_KEY_HERE";   // API Key (จากหน้า Dashboard)
input string   InpServerUrl     = "http://127.0.0.1:4000/api/mt5/push"; // URL Backend
input int      InpIntervalSec   = 2;                      // ส่งข้อมูลทุกกี่วินาที (แนะนำ 2)
input string   InpBotName       = "";                     // ชื่อ bot (ถ้าว่างใช้ชื่อ account)

//--- Constants
#define BACKFILL_PUSHES 5  // Send full-day history for first N pushes (let MT5 load history)

//--- Global Variables
datetime g_lastSend = 0;
datetime g_lastDealTime = 0;  // Track last processed deal time for closed deals
int      g_backfillPushes = 0; // Counter: how many backfill pushes done so far
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

   // Initialize deal tracking to broker midnight today so first run backfills
   // all of today's closed deals (profit+swap+commission) from MT5 deal history
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   g_lastDealTime = StructToTime(dt);

   Print("SENTINEL Reporter v1.60 started | Account: ", AccountInfoInteger(ACCOUNT_LOGIN),
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
// JSON helper: extract double value by key
//+------------------------------------------------------------------+
double JsonGetDouble(string json, string key)
{
   string search = "\"" + key + "\":";
   int pos = StringFind(json, search);
   if(pos < 0) return 0.0;
   pos += StringLen(search);
   while(pos < StringLen(json) && StringGetCharacter(json, pos) == ' ') pos++;
   int end = pos;
   while(end < StringLen(json)) {
      ushort c = StringGetCharacter(json, end);
      if(c == ',' || c == '}' || c == ' ' || c == ']') break;
      end++;
   }
   return StringToDouble(StringSubstr(json, pos, end - pos));
}

//+------------------------------------------------------------------+
// JSON helper: extract long (int) value by key
//+------------------------------------------------------------------+
long JsonGetLong(string json, string key)
{
   string search = "\"" + key + "\":";
   int pos = StringFind(json, search);
   if(pos < 0) return 0;
   pos += StringLen(search);
   while(pos < StringLen(json) && StringGetCharacter(json, pos) == ' ') pos++;
   int end = pos;
   while(end < StringLen(json)) {
      ushort c = StringGetCharacter(json, end);
      if(c == ',' || c == '}' || c == ' ' || c == ']') break;
      end++;
   }
   return StringToInteger(StringSubstr(json, pos, end - pos));
}

//+------------------------------------------------------------------+
// JSON helper: extract string value by key  (unescaped)
//+------------------------------------------------------------------+
string JsonGetString(string json, string key)
{
   string search = "\"" + key + "\":\"";
   int pos = StringFind(json, search);
   if(pos < 0) return "";
   pos += StringLen(search);
   int end = StringFind(json, "\"", pos);
   if(end < 0) return "";
   return StringSubstr(json, pos, end - pos);
}

//+------------------------------------------------------------------+
// Execute a single JSON command object
//+------------------------------------------------------------------+
void ExecuteCommand(string cmdJson)
{
   string cmdType = JsonGetString(cmdJson, "type");
   string cmdId   = JsonGetString(cmdJson, "id");

   if(cmdType == "CLOSE_ALL") {
      Print("SENTINEL CMD [", cmdId, "]: CLOSE_ALL");
      ExecuteCloseAll();
   }
   else if(cmdType == "CLOSE_POSITION") {
      ulong ticket = (ulong)JsonGetLong(cmdJson, "ticket");
      if(ticket > 0) {
         Print("SENTINEL CMD [", cmdId, "]: CLOSE_POSITION #", ticket);
         ExecuteClosePosition(ticket);
      } else {
         Print("SENTINEL CMD [", cmdId, "]: CLOSE_POSITION — missing ticket");
      }
   }
   else if(cmdType == "SET_SLTP") {
      ulong  ticket = (ulong)JsonGetLong(cmdJson, "ticket");
      double sl     = JsonGetDouble(cmdJson, "sl");
      double tp     = JsonGetDouble(cmdJson, "tp");
      if(ticket > 0) {
         Print("SENTINEL CMD [", cmdId, "]: SET_SLTP #", ticket, " sl=", sl, " tp=", tp);
         ExecuteSetSLTP(ticket, sl, tp);
      } else {
         Print("SENTINEL CMD [", cmdId, "]: SET_SLTP — missing ticket");
      }
   }
   else if(cmdType == "OPEN_TRADE") {
      string symbol  = JsonGetString(cmdJson, "symbol");
      string action  = JsonGetString(cmdJson, "action");
      double volume  = JsonGetDouble(cmdJson, "volume");
      double price   = JsonGetDouble(cmdJson, "price");
      double sl      = JsonGetDouble(cmdJson, "sl");
      double tp      = JsonGetDouble(cmdJson, "tp");
      string comment = JsonGetString(cmdJson, "comment");
      if(symbol != "" && volume > 0 && (action == "BUY" || action == "SELL")) {
         Print("SENTINEL CMD [", cmdId, "]: OPEN_TRADE ", action, " ", volume, " ", symbol,
               " price=", price, " sl=", sl, " tp=", tp);
         ExecuteOpenTrade(symbol, action, volume, price, sl, tp, comment);
      } else {
         Print("SENTINEL CMD [", cmdId, "]: OPEN_TRADE — invalid params symbol=", symbol,
               " action=", action, " volume=", volume);
      }
   }
   else {
      Print("SENTINEL CMD [", cmdId, "]: Unknown type=", cmdType);
   }
}

//+------------------------------------------------------------------+
// Parse response JSON and dispatch all commands in "commands" array
//+------------------------------------------------------------------+
void ProcessResponse(char &resultData[])
{
   string response = CharArrayToString(resultData);
   if(StringFind(response, "\"commands\"") < 0) return;

   // Find "commands":[ ... ]
   int arrStart = StringFind(response, "\"commands\":[");
   if(arrStart < 0) return;
   arrStart = StringFind(response, "[", arrStart);
   if(arrStart < 0) return;
   int arrEnd = StringFind(response, "]", arrStart);
   if(arrEnd < 0) return;

   string cmdsStr = StringSubstr(response, arrStart + 1, arrEnd - arrStart - 1);
   if(StringLen(cmdsStr) < 2) return; // empty array

   // Iterate through individual { ... } objects in the array
   int depth = 0;
   int cmdStart = -1;
   for(int i = 0; i < StringLen(cmdsStr); i++) {
      ushort c = StringGetCharacter(cmdsStr, i);
      if(c == '{') {
         if(depth == 0) cmdStart = i;
         depth++;
      }
      else if(c == '}') {
         depth--;
         if(depth == 0 && cmdStart >= 0) {
            string cmdJson = StringSubstr(cmdsStr, cmdStart, i - cmdStart + 1);
            ExecuteCommand(cmdJson);
            cmdStart = -1;
         }
      }
   }
}

//+------------------------------------------------------------------+
// Close all open positions and delete all pending orders
//+------------------------------------------------------------------+
void ExecuteCloseAll()
{
   int closed = 0, errors = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(g_trade.PositionClose(ticket)) { closed++; Print("SENTINEL: Closed #", ticket); }
      else { errors++; Print("SENTINEL: Failed close #", ticket, " err=", GetLastError()); }
   }

   int deleted = 0;
   for(int i = OrdersTotal() - 1; i >= 0; i--) {
      ulong ticket = OrderGetTicket(i);
      if(ticket == 0) continue;
      if(g_trade.OrderDelete(ticket)) { deleted++; Print("SENTINEL: Deleted pending #", ticket); }
      else { errors++; Print("SENTINEL: Failed delete pending #", ticket, " err=", GetLastError()); }
   }

   Print("SENTINEL: CloseAll done — closed:", closed, " deleted:", deleted, " errors:", errors);
}

//+------------------------------------------------------------------+
// Close a single position by ticket
//+------------------------------------------------------------------+
void ExecuteClosePosition(ulong ticket)
{
   if(g_trade.PositionClose(ticket))
      Print("SENTINEL: Closed position #", ticket);
   else
      Print("SENTINEL: Failed to close #", ticket, " err=", GetLastError(),
            " retcode=", g_trade.ResultRetcode());
}

//+------------------------------------------------------------------+
// Modify SL/TP for a position  (0 = no change / remove)
//+------------------------------------------------------------------+
void ExecuteSetSLTP(ulong ticket, double sl, double tp)
{
   if(!PositionSelectByTicket(ticket)) {
      Print("SENTINEL: SET_SLTP — position #", ticket, " not found");
      return;
   }
   if(g_trade.PositionModify(ticket, sl, tp))
      Print("SENTINEL: SL/TP set #", ticket, " sl=", sl, " tp=", tp);
   else
      Print("SENTINEL: Failed SET_SLTP #", ticket, " err=", GetLastError(),
            " retcode=", g_trade.ResultRetcode());
}

//+------------------------------------------------------------------+
// Auto-detect the correct order fill mode supported by this symbol's broker
// CTrade defaults to ORDER_FILLING_FOK which many brokers don't support
//+------------------------------------------------------------------+
ENUM_ORDER_TYPE_FILLING GetFillMode(string symbol)
{
   long fillMode = (long)SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
   if((fillMode & SYMBOL_FILLING_FOK) != 0) return ORDER_FILLING_FOK;
   if((fillMode & SYMBOL_FILLING_IOC) != 0) return ORDER_FILLING_IOC;
   return ORDER_FILLING_RETURN;
}

//+------------------------------------------------------------------+
// Open a market or limit order
//+------------------------------------------------------------------+
void ExecuteOpenTrade(string symbol, string action, double volume,
                      double price, double sl, double tp, string comment)
{
   // Auto-set fill mode to match broker's supported mode for this symbol
   // Fixes "CTrade::OrderTypeCheck: Invalid order type" (retcode=10035)
   g_trade.SetTypeFilling(GetFillMode(symbol));

   bool success = false;
   if(action == "BUY") {
      if(price <= 0) success = g_trade.Buy(volume, symbol, 0, sl, tp, comment);
      else           success = g_trade.BuyLimit(volume, price, symbol, sl, tp,
                                                 ORDER_TIME_GTC, 0, comment);
   }
   else if(action == "SELL") {
      if(price <= 0) success = g_trade.Sell(volume, symbol, 0, sl, tp, comment);
      else           success = g_trade.SellLimit(volume, price, symbol, sl, tp,
                                                  ORDER_TIME_GTC, 0, comment);
   }

   if(success)
      Print("SENTINEL: Opened ", action, " ", volume, " ", symbol,
            " ticket=", g_trade.ResultOrder());
   else
      Print("SENTINEL: Failed OPEN ", action, " ", symbol,
            " err=", GetLastError(), " retcode=", g_trade.ResultRetcode(),
            " comment=", g_trade.ResultComment());
}

//+------------------------------------------------------------------+
// Build closed deals JSON from MT5 deal history (exact P/L)
//+------------------------------------------------------------------+
string BuildClosedDealsJson()
{
   string json = "[";
   int count = 0;

   // BACKFILL MODE (first BACKFILL_PUSHES calls):
   //   Always look back to broker midnight so MT5 has time to load full history.
   //   MT5 loads history lazily — first call may return only recent deals.
   //   Subsequent backfill pushes will catch more as history loads.
   //   Backend uses upsert so duplicates are handled safely.
   //
   // NORMAL MODE (after backfill):
   //   Use 5-second rolling window to catch only new deals.

   bool isBackfill = (g_backfillPushes < BACKFILL_PUSHES);

   datetime brokerMidnight;
   {
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      dt.hour = 0; dt.min = 0; dt.sec = 0;
      brokerMidnight = StructToTime(dt);
   }

   datetime fromTime;
   if(isBackfill) {
      fromTime = brokerMidnight;  // Start of broker today (no -5 overlap needed)
      g_backfillPushes++;
      Print("SENTINEL: Backfill push ", g_backfillPushes, "/", BACKFILL_PUSHES,
            " | brokerMidnight=", TimeToString(brokerMidnight));
   } else {
      fromTime = g_lastDealTime - 5;
   }

   datetime toTime = TimeCurrent();
   if(!HistorySelect(fromTime, toTime)) return "[]";

   datetime maxDealTime = g_lastDealTime;

   for(int i = 0; i < HistoryDealsTotal(); i++) {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0) continue;

      // Only closing deals (DEAL_ENTRY_OUT)
      long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
      if(dealEntry != DEAL_ENTRY_OUT) continue;

      datetime dealTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);

      if(isBackfill) {
         // Backfill: include all of today's deals (skip yesterday's)
         if(dealTime < brokerMidnight) continue;
      } else {
         // Normal: skip deals already processed
         if(dealTime <= g_lastDealTime) continue;
      }

      // Track latest deal time
      if(dealTime > maxDealTime) maxDealTime = dealTime;

      // Get deal data
      long   positionId     = (long)HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
      string sym            = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
      long   dealType       = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
      double lots           = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
      double closePrice     = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
      double dealProfit     = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
      double dealSwap       = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
      double dealCommission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);

      // Get entry info (open price, entry commission, open time) from position's deal history
      double openPrice = 0;
      double entryCommission = 0;
      datetime openTime = 0;
      int posType = 0; // 0=BUY, 1=SELL (from entry deal)

      if(HistorySelectByPosition(positionId)) {
         for(int d = 0; d < HistoryDealsTotal(); d++) {
            ulong dt = HistoryDealGetTicket(d);
            long entry = HistoryDealGetInteger(dt, DEAL_ENTRY);
            if(entry == DEAL_ENTRY_IN) {
               openPrice = HistoryDealGetDouble(dt, DEAL_PRICE);
               entryCommission += HistoryDealGetDouble(dt, DEAL_COMMISSION);
               openTime = (datetime)HistoryDealGetInteger(dt, DEAL_TIME);
               long entryType = HistoryDealGetInteger(dt, DEAL_TYPE);
               posType = (entryType == DEAL_TYPE_BUY) ? 0 : 1;
            }
         }
      }

      // Re-select time-based history for next iteration
      HistorySelect(fromTime, toTime);

      // Total commission = entry + exit
      double totalCommission = entryCommission + dealCommission;

      if(count > 0) json += ",";
      json += StringFormat(
         "{\"positionId\":%I64d,\"ticket\":%I64u,\"symbol\":\"%s\",\"type\":%d,"
         "\"lots\":%.2f,\"openPrice\":%.5f,\"closePrice\":%.5f,"
         "\"profit\":%.2f,\"swap\":%.2f,\"commission\":%.2f,"
         "\"openTime\":\"%s\",\"closeTime\":\"%s\"}",
         positionId, dealTicket, JsonEscape(sym), posType,
         lots, openPrice, closePrice,
         dealProfit, dealSwap, totalCommission,
         TimeToString(openTime, TIME_DATE|TIME_MINUTES|TIME_SECONDS),
         TimeToString(dealTime, TIME_DATE|TIME_MINUTES|TIME_SECONDS)
      );
      count++;
   }

   // Update last deal time for next iteration
   if(maxDealTime > g_lastDealTime) g_lastDealTime = maxDealTime;

   json += "]";
   return json;
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
      double posSwap   = PositionGetDouble(POSITION_SWAP);
      double sl        = PositionGetDouble(POSITION_SL);
      double tp        = PositionGetDouble(POSITION_TP);
      datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);

      // Get commission from deal history for this position
      double posCommission = 0;
      long posId = (long)PositionGetInteger(POSITION_IDENTIFIER);
      if(HistorySelectByPosition(posId)) {
         for(int d = 0; d < HistoryDealsTotal(); d++) {
            ulong dealTicket = HistoryDealGetTicket(d);
            posCommission += HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
         }
      }

      if(orderCount > 0) ordersJson += ",";
      ordersJson += StringFormat(
         "{\"ticket\":%I64u,\"symbol\":\"%s\",\"type\":%d,\"lots\":%.2f,"
         "\"openPrice\":%.5f,\"currentPrice\":%.5f,\"profit\":%.2f,\"swap\":%.2f,"
         "\"commission\":%.2f,\"openTime\":\"%s\",\"sl\":%.5f,\"tp\":%.5f}",
         ticket, JsonEscape(sym), posType, lots,
         openPrice, curPrice, posProfit, posSwap,
         posCommission,
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

   // Build closed deals JSON from MT5 deal history (exact P/L)
   string closedDealsJson = BuildClosedDealsJson();

   // Broker server timezone offset (seconds from UTC)
   int brokerTimeOffset = (int)(TimeCurrent() - TimeGMT());

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
      "\"brokerTimeOffset\":%d,"
      "\"orders\":%s,"
      "\"pending\":%s,"
      "\"closedDeals\":%s"
      "}",
      JsonEscape(InpApiKey),
      accLogin,
      JsonEscape(botName),
      JsonEscape(broker),
      JsonEscape(server),
      JsonEscape(currency),
      leverage,
      balance, equity, margin, freeMargin, marginLvl, profit,
      brokerTimeOffset,
      ordersJson,
      pendingJson,
      closedDealsJson
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
