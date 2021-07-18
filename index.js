const mongoose = require("mongoose")
const app = require("./app")
var controladorAdmin = require("./src/Controladores/usuario.controlador");
var controladorServicio = require("./src/Controladores/servicio.controlador");

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/dbHoteles', { useNewUrlParser: true , useUnifiedTopology: true }).then(()=>{
    console.log('Bienvenido!');
    
    controladorAdmin.admin();
    controladorServicio.servicioDefault();

    app.listen(3000, function (){
        console.log("MY Hotel Gestor de Hoteles");
    })
}).catch(err => console.log(err))