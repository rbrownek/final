"use strict";


const express = require('express');
const path= require('path');
const app = express();
const bodyParser= require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
const portNumber = process.env.PORT || 7003;
const databaseName=`CMSC335DB-FinalProject`;
const collectionName=`searchedCities`;


const mongoose=require("mongoose");
const locationSchema= mongoose.Schema({
            location:String,
            url:String

        });
const City= mongoose.model("City",locationSchema);
console.log("Mongo variable exists:", !!process.env.MONGO_CONNECTION_STRING);


app.listen(portNumber);



//functions
const apiKey = process.env.WEATHERBIT_API_KEY;
console.log("Weather API key exists:", !!apiKey);

let lo;

async function getweather(location) {
    const city = location.city;
    const state = location.state ;
    lo = `${city}, ${state}`;

    let city_url = `https://api.weatherbit.io/v2.0/current?city=${encodeURIComponent(city)},${encodeURIComponent(state)}&key=${apiKey}&units=I`;

    try {
        await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

        let cityDoc = await City.findOne({ location: lo });

        if (cityDoc && cityDoc.url === "err") {
            throw new Error("This city was already marked as invalid");
        }

        if (!cityDoc) {
            cityDoc = new City({
                location: lo,
                url: city_url
            });

            await cityDoc.save();
        }

        const response = await fetch(cityDoc.url);

        if (!response.ok) {
            cityDoc.url = "err";
            await cityDoc.save();

            throw new Error(`Weather request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            cityDoc.url = "err";
            await cityDoc.save();

            throw new Error("No weather data returned");
        }

        const weather = data.data[0];

        return {
            location: lo,
            time: weather.ob_time,
            temp: weather.temp,
            description: weather.weather.description,
            app_temp: weather.app_temp
        };

    } catch (err) {
        console.log(`getweather err ${err}`);
        throw err;
    }
}



//routes
app.use(express.static("public"));
app.get("/",(request,response)=>{
    
    response.render("index");

});
app.get("/search",(request,response)=>{
    
    response.redirect("/");

});

app.post("/weather", (request,response)=>{
    let variables;
  
    const location={
        city:request.body.city || "College Park",
        state:request.body.state || "MD"
    }
    lo = `${location.city}, ${location.state}`;
    
   const result=getweather(location);
   result.then(info=>{
   
    if(!info){
        variables={
            location:lo
        }
        console.log("NO INFO");
        return response.render("err",variables);
    }else{
        variables=info;
        response.render("weather",variables);
    }

   



   }).catch(error=>{
    console.log(`post err ${error}`);

    variables={
            location:lo
        }
        response.render("err",variables);

   });


});