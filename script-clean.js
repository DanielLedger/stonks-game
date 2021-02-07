
const maxPrice = 2000; //The highest price that will be rendered.

const canvWidth = 1000;
const canvHeight = 600;
const canvStepLen = 100;

var money = 15000;

var globalStocks = [];

var globalTick;

function drawStockHistory(stockHist, target){
    var canvas = document.getElementById(target);
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvWidth, canvHeight);
    ctx.beginPath();
    ctx.strokeStyle = "red";
    var moved = false;
    for (var i = 0; i < stockHist.length; i++){
        var age = i;
        var pt = getPoint(stockHist[i], age);
        if (!moved){
            moved = true;
            ctx.moveTo(pt.x, pt.y);
        }
        else{
            ctx.lineTo(pt.x, pt.y);
        }
    }
    ctx.stroke();
    
}

function getPoint(val, age){
    return {x: canvStepLen*age, y: canvHeight - (canvHeight * (val/maxPrice))};
}

function randomNum(min, max){
    //Max is exclusive.
    var sc = Math.random();
    sc *= (max - min);
    return min + sc;
}

class Stock{
    constructor(initialValue, volatility, marketVolatility, idNum){
        this.val = initialValue;
        this.marketVal = 10000000;
        this.valInertia = randomNum(-volatility, volatility);
        this.history = [];
        this.vol = volatility;
        this.marketVol = marketVolatility;
        this.marketBias = 0; //Positive for buying stocks, negative for sold stocks.
        this.id = idNum;
        this.alive = true;
        
        this.owned = 0; //How many of these stonks the player owns.
        this.bindButtons();
    }
    
    bindButtons(){
        var buyBtn = document.getElementById("stock-" + this.id + "-buy");
        buyBtn.st = this;
        buyBtn.onclick = this.buy;
        var sellBtn = document.getElementById("stock-" + this.id + "-sell");
        sellBtn.st = this;
        sellBtn.onclick = this.sell;
        
    }
    
    //Gets the next value. Also updates the real value which is stored internally.
    getNextValue(){
        var range = this.marketVol;
        if (Math.floor(randomNum(0, 1000)) == 0){
            //Small chance of a massive price fluctuation.
            range *= 7;
        }
        var min = this.val - range + this.marketBias;
        var max = this.val + range + this.marketBias;
        if (this.history.length == 11){
            //Max history
            this.history.shift();
        }
        var newValue = randomNum(min, max);
        this.marketVal = newValue;
        this.history.push(newValue);
        //Now, update the real value.
        this.val += this.valInertia;
        //Now, update the value inertia
        this.valInertia = randomNum(-this.vol * 1.005, this.vol);
        //Return the value we just made, for use elsewhere.
        return newValue;
        
    }
    
    plot(){
        drawStockHistory(this.history, "stockgraph-" + this.id);
        document.getElementById("stock-" + this.id + "-value").innerHTML = "£" + Math.round(this.marketVal) + " per, " + this.owned + " owned.";
    }
    
    tick(){
        if (!this.alive){
            //Skip, stonk has crashed.
            return;
        }
        //Plot and update.
        var n = this.getNextValue();
        if (n <= 0){
            document.getElementById("stock-" + this.id + "-buy").disabled = true;
            document.getElementById("stock-" + this.id + "-sell").disabled = true;
            this.alive = false;
            //Rip
        }
        this.plot();
        if (this.marketBias != 0){
            if (this.marketBias > 0){
                this.marketBias -= 2;
            }
            else{
                this.marketBias += 2;
            }
        }
    }
    
    canBuy(){
        return money >= this.marketVal;
    }
    
    canSell(){
        return this.owned > 0;
    }
    
    buy(){
        if (money < this.st.marketVal){
            //Can't buy this stock
            return;
        }
        this.st.owned++;
        money -= this.st.marketVal;
        this.st.marketBias += 20;
    }
    
    sell(){
        if (this.st.owned == 0){
            return;
        }
        this.st.owned--;
        money += this.st.marketVal;
        this.st.marketBias -= 20;
    }
}

function globalTick(){
    var assetVal = 0;
    for (st in globalStocks){
        globalStocks[st].tick();
        assetVal += globalStocks[st].owned * globalStocks[st].marketVal;
    }
    document.getElementById("cash").innerHTML = "£" + Math.round(money);
    document.getElementById("assets").innerHTML = "£" + Math.round(assetVal);
}

function cashout(){
    clearInterval(globalTick);
    var finalResult = money;
    for (st in globalStocks){
        finalResult += globalStocks[st].owned * globalStocks[st].marketVal;
    }
    alert("You ended with £" + Math.round(finalResult) + "!");
    if (confirm("Play again?")){
        document.location.reload();
    }
}

function init(){
    //Define the function on the cashout button
    document.getElementById("cashout").onclick = cashout;
    //We need to define 8 stonks.
    globalStocks.push(new Stock(1600, 50, 70, "1")); //Safe investment
    globalStocks.push(new Stock(600, 50, 70, "2")); //Safe investment
    globalStocks.push(new Stock(1900, 150, 20, "3")); //Less safe investment
    globalStocks.push(new Stock(200, 40, 10, "4")); //Less safe investment
    globalStocks.push(new Stock(1100, 300, 100, "5")); //Dangerous investment
    globalStocks.push(new Stock(900, 50, 150, "6")); //Dangerous investment
    globalStocks.push(new Stock(400, 150, 80, "7")); //Basically a tech startup
    globalStocks.push(new Stock(1900, 500, 500, "8")); //Basically a tech startup
    globalTick = window.setInterval(globalTick, 250);
}

window.setTimeout(init, 2000);