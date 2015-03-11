var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    urlencode = require('urlencode');

fs.readFile('schools', function (err, data) {

  if (err) {
    return;
  }

  var schools = data.toString().split('\n');
  var current = 0;
  var startTime = (new Date()).getTime();

  requestNext(0);

  function requestNext (next) {
    requestId(current, function () {
      if (++current < schools.length) {
        requestNext(current);
      } else {
        var endTime = (new Date()).getTime();
        var spentTime = parseInt((endTime - startTime) / 1000);
        console.log('done searching all in ' + parseInt(spentTime / 60) + 'm' + (spentTime % 60) + 's');
      }
    });
  }

  function requestId (index, callback) {
    var url = 'http://data.api.gkcx.eol.cn/soudaxue/queryschool.html?messtype=jsonp&province=&schooltype=&page=1&size=10&keyWord1=' + 
              urlencode(schools[index]) + 
              '&schoolprop=&schoolflag=&schoolsort=&schoolid=&callback=jQuery17104998344804625958_1426047705757&_=1426047706812';

    request(url, function (err, res, body) {
      if (!err && res.statusCode == 200 && body.match(/"schoolid": "([0-9]*)",/)) {
        var id = body.match(/"schoolid": "([0-9]*)",/).pop();
        requestDetail(index, id, callback);
      } else {
        console.log('no id found when searching #' + index + ': ' + schools[index]);
        callback();
      }
    });
  }

  function requestDetail (index, id, callback) {
    var schoolUrl = 'http://gkcx.eol.cn/schoolhtm/schoolTemple/school' + id + '.htm';
    request(schoolUrl, function (err, res, body) {
      if (!err && res.statusCode == 200) {
        var $ = cheerio.load(body);
        var result =  $($('.line_24').find('p')[4]).text().replace(/电子邮箱：/g, '');
        if (result != '') {
          result += '\n'
          fs.appendFile('result.txt', result, function (err) {
            if (!err) {
              console.log('done searching #' + index + ': ' + schools[index]);
              callback();
            }
          });
        } else {
          console.log('found empty when searching #' + index + ': ' + schools[index]);
          callback();
        }
      } else {
        console.log('error occured when searching #' + index + ': ' + schools[index]);
        callback();
      }
    });
  }

});