const mongoose = require('mongoose');

// employee schema
const employeeSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true, "Name of the employee is required"],
    },
    surname :{
        type : String,
        required : [true, "Surname of the employee is required"],
    },
    department : {
        type : String,
        required : [true, "Department in which the employee works is required"],
    }
});

// department schema
const departmentSchema = new mongoose.Schema({
    departmentName : {
        type : String,
        unique : true,
        required : [true, "Department name is required"],
    },
    employeeNames : [{
        name : {
            type : String,
        },
        surname : {
            type : String,
        }
    }]
})


// creating modules
const Employee = new mongoose.model('Employee', employeeSchema);
const Department = new mongoose.model('Department', departmentSchema);
module.exports = {Employee, Department};