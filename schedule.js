function syncMain(){
  //今月と来月を201606という形式の文字列で取得する
  d = new Date();
  year = d.getFullYear();
  month = d.getMonth()+1;
  thisMonth = year.toString() + ( ("00") + month ).substr(-2);

  month = d.getMonth()+2;
  if(month > 12) {
    month -= 12;
    year += 1;
  }
  nextMonth = year.toString() + ( ("00") + (month) ).substr(-2);

  Logger.log(thisMonth);
  Logger.log(nextMonth);

  //今月と来月を２回回す。シート名は201606という形式にする。
  //もしシートがなければ（月初）、シートを作成する

  sync(thisMonth);
  sync(nextMonth);
}


//ホームページのスケジュールから、一年生のスケジュールを取得する。
//月は決め打ちだが、どうするか検討中（現在の月＋１くらいか）
function getOriginalEvents(sheetName) {
  var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1aSE2HDWMOtGMKdvuplF8zaFIJYWWGgMJ-_qtZJG322Y/pubhtml?gid=1434845912&single=true");
  var sheets = ss.getSheets();
  
  //var activeSheet = SpreadsheetApp.getActiveSheet();
  var activeSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = activeSpreadSheet.getSheetByName(sheetName);
  if (activeSheet == null) {
    activeSheet = activeSpreadSheet.insertSheet(sheetName);
  }
  
  clearDownloadData(sheetName);
  
  for (var i=0; i<sheets.length; i++){
    //Logger.log(sheets[i].getName());
    
    var s = sheets[i];
    if (s.getName() == sheetName){

      var event_index = 3;
      for ( var x=3; x<20; x++){
        if ( s.getRange(x, 1).getValue() == ""){
          break;
        }
        var date_object = s.getRange(x, 1).getValue();
        for ( var y=5; y>1; y--) {
          var cell = s.getRange(x, y).getValue();
          if ( cell != "") {
            var date_month = date_object.getMonth()+1;
            var date_day = date_object.getDate();
            var d = date_month + "/" + date_day;
            
            var context = s.getRange(x, y).getValue().replace(/[\n\r]/g, "");
            var reg = /(\d+:\d{2}).(\d+:\d{2})([^\d]+$)/m;
            var match = context.match(reg);
            //Logger.log(date_month + "/" + date_day + ": " + s.getRange(x, y).getValue());
            //Logger.log(d + ": " + match);
            
            // Load 取得データ
            if (match != null){
              var base_col = 8;
              Logger.log(match[0] + ", "+ match[1] + ", " + match[2]);
              activeSheet.getRange(event_index, base_col+0).setValue("'"+date_month + "/" + date_day);
              activeSheet.getRange(event_index, base_col+1).clearFormat().setValue("'"+match[3]);
              activeSheet.getRange(event_index, base_col+2).clearFormat().setValue("'"+match[1]);
              activeSheet.getRange(event_index, base_col+3).clearFormat().setValue("'"+match[2]);
              if( /小学校$|^等々力|^丸子橋/.test(match[3].toString())){
                activeSheet.getRange(event_index, base_col+4).clearFormat().setValue("'"+match[3]);
              }
              
              event_index++;
            } else{
              Logger.log("not match: " + context);
            }
            break;
          }
        }
      }  
     }
   }
}

//毎日実行する
//スケジュールを取得して、前回との差分を見て、
//差分があればメールした上で、前回を置き換える。
function sync(sheetName){
  getOriginalEvents(sheetName);
  if(!diff_events(sheetName)){
    copy_lastdata(sheetName);
  }
}

//取得したデータを一度クリアする。再取得する際の初期化
function clearDownloadData(sheetName){
  //var activeSheet = SpreadsheetApp.getActiveSheet();
  var activeSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = activeSpreadSheet.getSheetByName(sheetName);
  for (var j=0; j<20; j++) {
    for (var i=0; i<5; i++) {
      activeSheet.getRange(3+j, 8+i).clearFormat().setValue("");
    }
  }
}

//前回のデータを差し替える
function copy_lastdata(sheetName){
  //var activeSheet = SpreadsheetApp.getActiveSheet();
  var activeSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = activeSpreadSheet.getSheetByName(sheetName);
  
  activeSheet.getRange("H3:L22").copyTo(activeSheet.getRange("C3:G22"));
  
  for (var i=0; i<20; i++){
    var title = activeSheet.getRange(3+i, 4).getValue();
    if(title != ""){
      var name = activeSheet.getRange(3+i, 1).getValue();
      activeSheet.getRange(3+i, 2).setValue(title + "("+ name  +")");
    }else{
      activeSheet.getRange(3+i, 2).setValue("");
    }
  }
}

//取得したデータと、今回のデータとの差分を見る
//差分があれば、まとめてメールする。
function diff_events(sheetName){
  //var activeSheet = SpreadsheetApp.getActiveSheet();
  var activeSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = activeSpreadSheet.getSheetByName(sheetName);
  var src_index = 3;
  var src_base = 8;
  var dst_index = 3;
  var dst_base = 3;
  var mes_base = "以下のスケジュールが更新されました。\n詳しくは、FC中原のホームページをご覧ください。\n\n";
  var mes = "";
  
  for (var i=0; i<20; i++) {
    var srcRange = activeSheet.getRange(src_index, src_base, 1, 5);
    var dstRange = activeSheet.getRange(dst_index, dst_base, 1, 5);
    
    var isEqual = 1;
    Logger.log(srcRange.getCell(1,1).getValue() +" <=> "+ dstRange.getCell(1,1).getValue());
    for (var x =1; x<= 5; x++) {
      //Logger.log(srcRange.getCell(1,x).getValue() +" <=> "+ dstRange.getCell(1,x).getValue());
      if (srcRange.getCell(1,x).getValue() != dstRange.getCell(1,x).getValue()) {
        isEqual = 0;
      }
    }
    
    if(isEqual){
      //Logger.log("equal");
      src_index++;
      dst_index++;
    } else {
      //Logger.log("not equal:" + srcRange.getValue() + dstRange.getValue());
      
      var reg = /\d+\/(\d+)/;
      var src_d = srcRange.getCell(1,1).getValue().toString();
      var dst_d = dstRange.getCell(1,1).getValue().toString();
      
      var src_date = 99;
      var dst_date = 99;
      var src_hasValue = true;
      var dst_hasValue = true;
      
      if (src_hasValue = reg.test(src_d)){
        var m = src_d.match(reg);
        src_date = Number(m[1])
      }
      if(dst_hasValue = reg.test(dst_d)){
        var m = dst_d.match(reg);
        dst_date = Number(m[1]);
      }
      //
      //Logger.log(src_hasValue + "," + dst_hasValue);
      
      if(src_hasValue || dst_hasValue) {
        Logger.log(src_date + " <=>" + dst_date);
        
        var src_str = srcRange.getCell(1,1).getValue() + ": "+srcRange.getCell(1,2).getValue() +
        " [" + srcRange.getCell(1,3).getValue() + " - " + srcRange.getCell(1,4).getValue() +"]";
        var dst_str = dstRange.getCell(1,1).getValue() + ": "+dstRange.getCell(1,2).getValue()+
        " [" + dstRange.getCell(1,3).getValue() + " - " + dstRange.getCell(1,4).getValue() +"]"
        if( src_date > dst_date) {
          mes += "---- " + dst_str+"\n";
          dst_index++;
        }else if( src_date < dst_date){
          mes += "++++ " + src_str+"\n";
          src_index++;
        }else{
          mes += "---- " + dst_str+"\n";
          mes += "++++ " + src_str+"\n";
          dst_index++;
          src_index++;
        }
      }
    }

  }
  
  if( mes != ""){
    //Logger.log(mes);
    var footer = "\n\nこのメールはシステムより自動送信されています。";
    GmailApp.sendEmail("wolf.masa@gmail.com", "FC中原2009：月間予定表が更新されました", mes_base + mes + footer);
    copy_lastdata(sheetName);
    return false;
  }
  return true;
}

function delete_event(calendar, startTime){
  // 同じ日にイベントが２つある場合には？
  
  // startTime から同じ日のイベントを削除する
  var month = startTime.getMonth()+1;
  var day = startTime.getDate();
  var start_of_day = new Date(month, day);
  var twoHoursFromNow = new Date(start_of_day + (24 * 60 * 60 * 1000));
 var events = cal.getEvents(start_of_Day, twoHoursFromNow);
 Logger.log('Number of events: ' + events.length);
  
  // なかったらそのまま（エラーではない）
  if( events.length == 0){
    return ;
  }else if (events.length > 1){
    // 2つあるのでどうしよう。
  }else{
    //delete
  }
}

function create_event(calendar, title, startTime, endTime){
  var event = calendar.createEvent(title, startTime, endTime);
 Logger.log('Event ID: ' + event.getId());
  return event;
}


// 差分のイベントを更新する。
function update_GCalender(title, startTime, endTime){
  
  var cal = CalendarApp.getDefaultCalendar();
  
  // 更新元のイベントを抽出し、削除する。
  delete_event(cal, startTime);
  
  // 更新するイベントを作成し、登録する
  create_event(cal, title, startTime, endTime);
　}