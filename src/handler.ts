import * as fs from "fs"
import * as path from "path"

export enum VehicleType {
    Car, Boat, Plane, Drone
}

export enum VehicleStatus {
    Online, Offline, Error, New
}

export abstract class Vehicle {
    id: string;
    status: VehicleStatus = VehicleStatus.New;
    abstract type: VehicleType;
    name: string;
    settings: { [key: string]: any } | {};
    info: { [key: string]: string } | {};

    constructor(id: string, name: string, settings: { string: string | boolean } | {} = {}, info: { string: string } | {} = {}) {
        this.id = id;
        this.name = name;
        this.info = info;
        this.settings = settings;
    }
}

interface VehicleList { [key: string]: Vehicle };

export class Car extends Vehicle {
    type = VehicleType.Car;
}

/**
 * Registry, keeping all registered vehicles (This could be replaced by a DB)
 */
export class VehicleRegistry {
    registry: VehicleList = {};

    /**
     * Creates a registry and loads the data from the file
     * @param fileName the path to the file, which will be used as a DB
     */
    constructor(fileName: string) {
        this.load(fileName);
    }

    /**
     * Loads data from a file
     * @param fileName the name to the file
     */
    load(fileName: string): void {
        if (fs.existsSync(fileName))
            this.registry = JSON.parse(fs.readFileSync(path.join(__dirname, fileName), "utf-8"));
    }

    /**
     * Saves data to a json file
     * @param fileName the name to the file
     */
    save(fileName: string): void {
        fs.writeFileSync(path.join(__dirname, fileName), JSON.stringify(this.registry));
    }

    /**
     * The function checks if the vehicle has been registered
     * @param ID the identifiable string of the vehicle 
     * @returns true if the vehicle has been registered, false otherwise
     */
    isRegistered(ID: string): boolean {
        return this.registry.hasOwnProperty(ID);
    }

    /**
     * The function retrieves the vehicle and presents it as an object
     * @param ID the identifiable string (or array of strings) of the vehicle
     * @returns the vehicle data
     * @throws Error if the vehicle does not exist
     */
    getById(ID: string | string[]): Vehicle[] {
        let IDs = Array.isArray(ID) ? ID : Array(ID);
        let ret: Vehicle[] = [];

        IDs.forEach(el => {
            if (this.isRegistered(el))
                ret.push(this.registry[el]);
            else
                throw Error(`Vehicle with ID ${el} does not exist`);
        });

        return ret;
    }

    /**
     * Registeres a new car with thichever storage system is used
     * @param ID the identifiable string of the car  
     * @param name the name of the car
     * @param settings the settings of the car
     * @param info additional info about the car
     * @returns the newly created car
     * @throws Error if a car with the same ID has already been registered
     */
    registerCar(ID: string, name: string, settings: { [key: string]: string | boolean } | {} = {}, info: { [key: string]: string } | {} = {}): Vehicle {
        // Create new car
        var newCar = new Car(ID, name, settings, info);

        if (!this.isRegistered(ID))
            this.registry[ID] = newCar;
        else
            throw Error("Car is already registered");

        // Return the newly created car
        return newCar;
    }

    deleteCar(ID: string) {
        delete this.registry[ID];
    }
}

