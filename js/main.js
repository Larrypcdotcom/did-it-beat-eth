//------------------------------------------------------------------------------
// Global variables
//------------------------------------------------------------------------------

const currencySymbols = {
  usd: "$",
  cad: "$",
  aud: "$",
  eur: "€",
  gbp: "£",
  chf: "",
  jpy: "¥",
  krw: "₩",
  cny: "¥",
  sgd: "$",
  inr: "₹",
  rub: "₽",
  btc: "₿",
  eth: "Ξ",
  rune: "ᚱ"
};

const today = new Date();

var dates = {};
var coins = [];
var prices = { today: {}, historical: {} };

var userSelectedCurrency = null;
var userSelectedTimespan = null;

var ethMultiple;

//------------------------------------------------------------------------------
// Helper functions
//------------------------------------------------------------------------------

const _showSpinner = () => {
  $("#spinnerContainer").fadeIn();
}

const _hideSpinner = () => {
  $("#spinnerContainer").fadeOut();
}

// https://stackoverflow.com/questions/563406/add-days-to-javascript-date
Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

const _formatDate = (date) => {
  let year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');
  return `${day}-${month}-${year}`;  // CoinGecko API date format: dd-mm-yyyy
};

const getDates = () => {
  return {
    "today": _formatDate(today),
    "3d": _formatDate(today.addDays(-3)),
    "7d": _formatDate(today.addDays(-7)),
    "14d": _formatDate(today.addDays(-14)),
    "30d": _formatDate(today.addDays(-30)),
    "90d": _formatDate(today.addDays(-90)),
    "180d": _formatDate(today.addDays(-180)),
    "ytd": _formatDate(new Date(today.getFullYear(), 0, 1)),
    "1y": _formatDate(today.addDays(-365))
  };
};

const fetchCurrentPrices = async () => {
  var coinIds = "";
  for (var i = 0; i < coins.length; i++) {
    coinIds += "%2C" + coins[i].id;
  }

  pricesToday = await $.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd%2C${userSelectedCurrency}`);

  for (var i = 0; i < coins.length; i++) {
    if (userSelectedCurrency == "rune") {
      prices["today"][coins[i].symbol] = pricesToday[coins[i].id].usd / pricesToday["thorchain"].usd;
    } else {
      prices["today"][coins[i].symbol] = pricesToday[coins[i].id][userSelectedCurrency];
    }
  }
};

const fetchHistoricalPrices = async () => {
  let coin;
  $("#indexTotal").html(coins.length);

  if (userSelectedCurrency == "rune") {
    pricesHistoricalRune = (await $.get(`https://api.coingecko.com/api/v3/coins/thorchain/history?date=${dates[userSelectedTimespan]}`))["market_data"]["current_price"];
  }

  for (var i = 0; i < coins.length; i++) {
    coin = coins[i];
    $("#indexCurrent").html(i + 1);

    try {
      pricesHistorical = (await $.get(`https://api.coingecko.com/api/v3/coins/${coin.id}/history?date=${dates[userSelectedTimespan]}`))["market_data"]["current_price"];

      if (userSelectedCurrency == "rune") {
        price = pricesHistorical.usd / pricesHistoricalRune.usd;
      } else {
        price = pricesHistorical[userSelectedCurrency];
      }

      console.log(`Fetched price of ${coin.symbol.toUpperCase()} on ${dates[timespan]}: ${_formatMoney(price)}`);
      prices["historical"][coin.symbol] = price;
    } catch (e) {
      console.log(`Price not available for ${coin.symbol.toUpperCase()} on ${dates[userSelectedTimespan]}`);
      prices["historical"][coin.symbol] = null;
    }
  }
};

const _formatMoney = (number, decPlaces) => {
  if (typeof number == 'string') {
    number = number.replace(/,/gi, '');
    number = parseFloat(number);
  }

  var i = String(parseInt(number = Math.abs(Number(number) || 0)));
  var j = (j = i.length) > 3 ? j % 3 : 0;

  var k = number - i;
  if (number > 1) k = k.toFixed(2);
  else k = k.toPrecision(4);

  var formattedNumber =
    (j ? i.substr(0, j) + ',' : '') +
    i.substr(j).replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    ('.' + String(k).slice(2));

  return currencySymbols[userSelectedCurrency] + formattedNumber;
};

const _chooseColor = (dp) => {
  console.log(dp, ethMultiple);
  if (dp[0] == "BTC") return "btc";
  else if (dp[0] == "ETH") return "eth";
  else {
    if (dp[3] >= 1.5 * ethMultiple) return "winner";
    else if (dp[3] <= 0.5 * ethMultiple) return "loser";
    else return "white";
  }
};

const _newRow = (symbol, priceHistorical, priceToday, multiple, color = "white") => {
  return `
    <tr>
      <td><span class="color-${color}">${symbol.toUpperCase()}</span></td>
      <td><span class="color-${color}">${_formatMoney(priceHistorical)}</span></td>
      <td><span class="color-${color}">${_formatMoney(priceToday)}</span></td>
      <td><span class="color-${color}">${multiple.toFixed(1)}</span></td>
    </tr>
  `;
};

const renderTable = () => {
  var data = [];

  for (var i = 0; i < coins.length; i++) {
    symbol = coins[i].symbol;
    if (prices["historical"][symbol]) {
      multiple = prices["today"][symbol] / prices["historical"][symbol];
      console.log(`Multiple of ${symbol}: ${multiple.toFixed(1)}`);
      data.push([ symbol, prices["historical"][symbol], prices["today"][symbol], multiple ]);
    }
  }

  ethMultiple = data[0][3];

  data.sort((a, b) => {
    if (a[3] > b[3]) return -1;
    else if (a[3] < b[3]) return 1;
    else return 0;
  })

  var content = `
    <table class="table table-sm table-borderless text-left mt-0 ms-auto me-auto max-width-600px">
      <thead>
        <tr>
          <th scope="col">symbol</th>
          <th scope="col">prices-${userSelectedTimespan}</th>
          <th scope="col">prices-today</th>
          <th scope="col">multiple</th>
        </tr>
        <tr>
          <th scope="col">--------</th>
          <th scope="col">--------------</th>
          <th scope="col">--------------</th>
          <th scope="col">----------</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (var i = 0; i < data.length; i++) {
    content += _newRow(data[i][0], data[i][1], data[i][2], data[i][3], _chooseColor(data[i]));
  }

  content += "</tbody></table>";
  $("#tableContainer").html(content);
};

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

$(async () => {
  dates = getDates(new Date());
  console.log("Generates dates\n", dates);

  coins = await $.get("js/coins.json");
  console.log("Fetched a list of coins\n", coins);

  for (currency of [
    "Usd", "Cad", "Gbp", "Aud", "Eur", "Chf", "Jpy", "Krw", "Cny",
    "Sgd", "Inr", "Rub", "Btc", "Eth", "Rune"
  ]) {
    $(`#currency${currency}`).click(function () {
      console.log(`Currency selected: ${$(this).val()}`);
      userSelectedCurrency = $(this).val();
    })
  }

  for (timespan of [
    "3d", "7d", "14d", "30d", "90d", "180d", "Ytd", "1y"
  ]) {
    $(`#timespan${timespan}`).click(function () {
      console.log(`Timespan selected: ${$(this).val()}`);
      userSelectedTimespan = $(this).val();
    })
  }

  $("#currencyUsd").trigger("click");
  $("#timespan90d").trigger("click");

  $("#submitBtn").click((event) => {
    event.preventDefault();
    _showSpinner();
    fetchCurrentPrices()
    .then(fetchHistoricalPrices)
    .then(renderTable)
    .then(_hideSpinner);
  });
});
