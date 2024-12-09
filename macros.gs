function resize() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('4:4').activate();
  spreadsheet.getActiveSheet().setRowHeight(4, 130);
  spreadsheet.getRange('K9').activate();
};