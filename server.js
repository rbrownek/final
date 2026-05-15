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

const url=process.env.MONGO_CONNECTION_STRING;



app.listen(portNumber);



//functions
const apiKey = "abfaeb91c8aa4912b77cc4699a868e06";
let lo;

async function getweather(location) {
    const city = location.city;
    const state = location.state ?? "Maryland";
  
    let url = `https://api.weatherbit.io/v2.0/current?city=${city},${state}&key=${apiKey}&units=I`;
    try{
        await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
        //look for city and url in datbase first 
        
        let filter={location:lo};
        let newCity;
        /*const newCity= new City({
            location:lo,
            url:url
        });
        await newCity.save();
        
        */
        let cities= await City.find(filter);
        if (cities.length>0){
            url=cities[0].url
            if(url === "err"){
                 throw new Error("Weather request failed");
            }
        }else{
             newCity= new City({
                location:lo,
                url:url
            });
            await newCity.save();

        }

        //use api to get weather
        

        try {





            const response = await fetch(url);
            if (!response.ok){
                newCity.url="err";
                await newCity.save();
                throw new Error("Weather request failed");

            } 
            const data = await response.json();
            const weather = data.data[0];
            const info={
                location: lo,
            time: weather.ob_time,
            temp: weather.temp,
            description: weather.weather.description,
            app_temp: weather.app_temp
            }


            return {
            location: lo,
            time: weather.ob_time,
            temp: weather.temp,
            description: weather.weather.description,
            app_temp: weather.app_temp
            };
        } catch (error) {
            throw error;
        }


        


    }catch(err){
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
        return response.render("err",variables);
    }else{
        variables=info;
        response.render("weather",variables);
    }

   



   }).catch(error=>{
    variables={
            location:lo
        }
        response.render("err",variables);

   });


});