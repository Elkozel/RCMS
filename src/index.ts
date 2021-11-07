import { Socket } from "socket.io";
import { Vehicle, VehicleRegistry, VehicleStatus } from "./handler";


// Definitions
const L_PORT = 3000;
const SAVE_FILE = "DB.json";

// 
const options = { /* ... */ };
const io = require("socket.io")(options);

var activeVehicles: Vehicle[] = [];
var registeredVehicles: VehicleRegistry = new VehicleRegistry(SAVE_FILE);

console.log(JSON.stringify(registeredVehicles));
try {
    registeredVehicles.registerCar("AAA", "TestCar", {}, {});
    registeredVehicles.save(SAVE_FILE);
}
catch (err) {
    console.log("A car with device ID has already been registered!");
}

io.use(connectionAuth);

io.on("connection", (socket: Socket) => {
    let vehicle: Vehicle = socket.data.vehicle;
    vehicle.status = VehicleStatus.Online;

    console.info(`Client with ID ${vehicle.id} connected`)

    activeVehicles.push(vehicle);

    socket.on("request", args => {
        args = Array.isArray(args) ? args : Array(args);
        console.log(`The args are ${args}`)
        try {
            let result = handleRequest(...args);
            socket.emit("response", { "request": args, "response": result });
        }
        catch (err: any) {
            socket.emit("error", err.message);
        }
    })

    socket.on("disconnect", () => {
        console.log(`A socket was disconnected`);
        vehicle.status = VehicleStatus.Offline;
        activeVehicles.splice(activeVehicles.indexOf(vehicle), 1);
    })
});

var commands: { [key: string]: (artgs: any[]) => any } = {
    "getAll": () => registeredVehicles,
    "getActive": () => activeVehicles,
    "getCars": () => activeVehicles,
    "getID": VehicleRegistry.prototype.getById
}

function handleRequest(...args: any[]): Vehicle[] {

    // Check if such command exists
    if (commands.hasOwnProperty(args[0])) {
        return commands[args[0]](args.splice(1)); // execute function for this command
    }
    else
        throw Error(`The command \"${args}\" was not recognized`);
}

function connectionAuth(socket: Socket, next: any) {
    var auth = socket.handshake.auth; // Get authentication from the handshake

    if (auth.ID == undefined) // extract the ID of the authenticator
        next(new Error("no ID was specified"));

    if (!registeredVehicles.isRegistered(auth.ID))  // Check if a vehicle with this ID exists\
        next(new Error("The specified ID does not exist"))

    // Save the vehicle inside in the socket and call the next middleware
    socket.data.vehicle = registeredVehicles.getById(auth.ID)[0];
    console.info(`Vehicle ${socket.data.vehicle} with ID ${String(socket.data.vehicle.id)} connected!`);
    next();
}

io.listen(3000, () => console.log("Everything is ready!"));