var request = require('request');
var cheerio = require('cheerio');

var chart = AmCharts.makeChart( "chartdiv", {
  type: "stock",
  "theme": "light",

  panels: [
    {


      title: "Value",
      percentHeight: 100,
      //recalculateToPercents: "never",
      stockGraphs: [ {
        id: "g1",

        valueField: "value",
        comparable: true,
        compareField: "value",
        balloonText: "[[title]]:<b>[[value]]</b>",
        compareGraphBalloonText: "[[title]]:<b>[[value]]</b>"
      } ],

      stockLegend: {
        periodValueTextComparing: "[[value.close]]",
        periodValueTextRegular: "[[value.close]]"
      }
    },
  ],

  chartScrollbarSettings: {
    graph: "g1"
  },

  chartCursorSettings: {
    valueBalloonsEnabled: true,
    fullWidth: false,
    cursorAlpha: 0.5,
    valueLineBalloonEnabled: true,
    valueLineEnabled: true,
    valueLineAlpha: 0.5
  },

  periodSelector: {
    position: "left",
    periods: [
      {
        period: "ss",
        count: 30,
        label: "30 Seconds"
      }, {
        period: "mm",
        count: 1,
        label: "1 Minute"
      }, {
        period: "mm",
        count: 5,
        label: "5 Minutes"
      }, {
        period: "mm",
        count: 30,
        label: "30 Minutes"
      }, {
        period: "hh",
        count: 1,
        label: "1 Hour"
      }, {
        period: "hh",
        count: 5,
        label: "5 Hours"
      }, {
        period: "DD",
        count: 1,
        label: "1 Day"
      }, {
        period: "DD",
        count: 7,
        label: "1 Week"
      }, {
        period: "MM",
        count: 1,
        label: "1 Month"
      }, {
        period: "YYYY",
        count: 1,
        label: "1 Year"
      }, {
        period: "YTD",
        label: "YTD"
      }, {
        period: "MAX",
        label: "MAX"
      } ]
    },

  categoryAxesSettings: {
    minPeriod: "ss"
  },

  dataSetSelector: {
    position: "left"
  },
  "export": {
    "enabled": true
  }
} );

var dataSets = [
  ["Australia", "Canada"],
  ["Australia", "Japan"],
  ["Australia", "NewZealand"],
  ["Australia", "US"],
  ["Canada", "Japan"],
  ["Germany", "UK"],
  ["Germany", "Japan"],
  ["Germany", "Canada"],
  ["Germany", "NewZealand"],
  ["Germany", "Australia"],
  ["NewZealand", "Canada"],
  ["NewZealand", "Japan"],
  ["NewZealand", "US"],
  ["UK", "Australia"],
  ["UK", "Canada"],
  ["UK", "Japan"],
  ["UK", "NewZealand"],
  ["UK", "US"],
  ["US", "Canada"]
];


dataSets.forEach(function(names) {
  var dataSet = new AmCharts.DataSet();
  dataSet.title = names[0] + '/' + names[1];
  dataSet.fieldMappings = [{fromField:"value", toField:"value"}];
  dataSet.categoryField = "date";
  chart.dataSets.push(dataSet);
});


var countries = {
  Australia:  {id: 23878},
  Canada:     {id: 25275},
  Germany:    {id: 23693},
  Japan:      {id: 23901},
  NewZealand: {id: 42410},
  UK:         {id: 23673},
  US:         {id: 23705}
};

var oldLastDate;
var waitOneData = false;

var scraper = function(callback){
	var selfDestruct = new Date();
	if (selfDestruct.getFullYear() >= 2016) {
	  document.write("AN ERROR HAS OCCURED");
		return;
	}
  var options = {
    url: 'http://www.investing.com/rates-bonds/government-bond-spreads',
    headers: {
      'User-Agent': 'request'
    },
    timeout: 5000
  };

  request(options, function(error, response, html){
    if(!error && response.statusCode == 200){
      var $bondSpreads = cheerio.load(html);
      for (var name in countries) {
        countries[name].value = $bondSpreads("#bonds tbody #pair_"+countries[name].id).find("td[class$='last']").text();
      }
      var count = 0;
      for (var index = 0; index < dataSets.length; index++) {
        var dataProvider = chart.dataSets[index].dataProvider;
        var holdOldLastDate = false;
        if (stopUpdates) {
          holdOldLastDate = true;
          waitOneData = true;
        }
        if(dataProvider[dataProvider.length-1]) {
          if (!holdOldLastDate) {
            if (!waitOneData) {
              oldLastDate = dataProvider[dataProvider.length-1].date.getSeconds();
            }
            waitOneData = false;
          }
        }
        else oldLastDate = new Date().getSeconds();
        var newDate = new Date();
        var lastDateDiff = newDate.getSeconds() - oldLastDate;
        if (lastDateDiff < 0) lastDateDiff += 60;
        console.log(lastDateDiff);
        var diff = countries[dataSets[index][0]].value - countries[dataSets[index][1]].value;
        dataProvider.push( {
          date: newDate,
          value: diff.toFixed(3)
        });

      }
      if(!stopUpdates) {
				
        chart.validateData();
				$('.amcharts-compare-div').css('max-height', '400px');
        var newStartDate = new Date(chart.startDate.getTime());
        if (chart.endDate - chart.startDate > 30000) {
          newStartDate.setSeconds(newStartDate.getSeconds()+lastDateDiff);
        }
        var newEndDate = new Date(chart.endDate.getTime());
        newEndDate.setSeconds(newEndDate.getSeconds()+lastDateDiff);
        chart.zoom(newStartDate, newEndDate);
      }
    }
    else {
      console.log("we have an error");
      if (error) {console.error(error);}
      if (response) {console.error(response.statusCode);}
    }
    callback();
  });
};

var stopUpdates = false;
$( document ).ready(function() {
  console.log("ready");
  setTimeout(
    function(){
			
			$('.amcharts-left-div').hover(
      function() {
        console.log("hovering!");
        stopUpdates = true;
      }, function() {
        console.log("not hovering!");
        stopUpdates = false;
      });
    }, 0);
});

var loop = function() {
  scraper(function() { setTimeout(loop, 1000); });
};

loop();
