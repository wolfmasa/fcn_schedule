require "google_drive"
 
session = GoogleDrive::Session.from_config("config.json")
 
# https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxx/
# 事前に書き込みたいスプレッドシートを作成し、上記スプレッドシートのURL(「xxx」の部分)を以下のように指定する
sheets = session.spreadsheet_by_key("1aSE2HDWMOtGMKdvuplF8zaFIJYWWGgMJ-_qtZJG322Y").worksheets

title = '201910'
grade = '4年'
day   =  '27'

# 対象となるシートを選択
s = sheets.find {|sheet| sheet.title == title}

# 日付を探す
r = Regexp.new("^#{day}" + '\D')
d_index = s.rows.find_index {|row| r =~ row[0]}

# 対象となる列を選択（学年）
g_index = s.rows[1].find_index {|r| r.include?(grade) }

# 対象の日を探す
# もし空文字列なら左を見にいく
#p s[d_index+1, g_index+1]
schedule = ""
loop{
    schedule = s[d_index+1, g_index+1]
    break if schedule != ""
    g_index -= 1
    raise if g_index < 0
}

p schedule