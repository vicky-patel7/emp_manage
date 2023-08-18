require('dotenv').config();
const express = require('express');
const app = express();
const { validationResult, check } = require('express-validator');
const hbs = require('hbs');
const path = require('path');
const addEmployeeData = require('../controllers/addEmployeeData')
const mongoose = require('mongoose');
const connectDB = require('../config/connect');
const { Employee, Department } = require('./db/models');

// defining port number
const PORT = process.env.PORT || 3000;

// connecting to database
connectDB();

// for using json data
app.use(express.json());

// for url encoding
app.use(express.urlencoded({
    extended: true
}));


// setting the templates engine and paths
const viewsPath = path.join(__dirname, '..', 'templates', 'views');
const partialsPath = path.join(__dirname, '..', 'templates', 'partials');
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);



// using the static files 
app.use(express.static(path.join(__dirname, '..', 'public')));


// rendering or routing files and routes
app.get('/', (req, res) => {
    res.render('index');
})

// get routes
app.get('/addEmployee', (req, res) => {
    res.render('addEmployee', {
        errors: [],
        success: "",
        errorMessage: "",
    });
})

// adding a new employee in the data employee list and department list
app.post('/addEmployee', [
    check('firstname').notEmpty().withMessage('First name is required'),
    check('surname').notEmpty().withMessage('Surname is required'),
    check('department').notEmpty().withMessage('Department is required')
], async (req, res) => {
    const errors = validationResult(req);
    let success = "";
    let errorMessage = "";
    // check if any field is missing
    if (!errors.isEmpty()) {
        return res.render('addEmployee', { errors: errors.array(), success: success });
    }
    // checking if the employee is already in the employee list
    const employeeExist = await Employee.findOne({
        name: req.body.firstname,
        surname: req.body.surname,
        department: req.body.department
    }).exec();
    // if present, add error message
    if (employeeExist) {
        errorMessage = "Employee already exists in the employee list \n ";
    } else {
        // else add the employee to the employee list
        var newEmployee = await Employee.create({ name: req.body.firstname, surname: req.body.surname, department: req.body.department });
    }
    // finding if the department exists
    const dep = await Department.findOne(
        { departmentName: req.body.department }
    ).exec();
    // if department doens't exist, create a new department and then add the employee data to the department
    if (!dep) {
        const newDepartment = await Department.create({ departmentName: req.body.department, employeeNames: [] });
        newDepartment.employeeNames.push(newEmployee);
        newDepartment.save();
        success = "New Department created, and the employee is added successfully";
    } else {
        // else search if the employee is already in the department
        const employeeInDep = await Department.findOne({
            departmentName: req.body.department,
            employeeNames: {
                $elemMatch: {
                    name: req.body.firstname,
                    surname: req.body.surname
                }
            }
        }).exec();
        // if it is present, then no need to add
        if (employeeInDep) {
            errorMessage = errorMessage + "Employee Already exists in the Department."
        } else {
            // else add the employee to the department
            dep.employeeNames.push(newEmployee);
            dep.save();
            success = "New Employee added in existing Department";
        }
    }
    return res.render('addEmployee', { errors: errors.array(), success: success, errorMessage: errorMessage });
});

// according to the department see the employee names
app.get('/department', async (req, res) => {
    let department;
    try {
        department = await Department.find();
    } catch (err) {
        console.log(err);
    }
    res.render('department', { departmentData: department });
})

app.get('/about', (req, res) => {
    res.render('about');
})

// views the employees name, surname and their department
app.get('/viewEmployees', async (req, res) => {
    let employeeData;
    try {
        employeeData = await Employee.find();
    } catch (err) {
        console.log(err);
    }
    return res.render('viewEmployees', { employeeData: employeeData });
})

// deleteing the employee
app.get('/deleteEmployee/:id', async (req, res) => {
    const employeeId = req.params.id;
    try {
        const deleteEmployee = await Employee.findByIdAndDelete(employeeId).exec();
        if (deleteEmployee) {
            const empInDep = await Department.findOne(
                { department: deleteEmployee.department },
                { $pull: { employeeNames: { _id: deleteEmployee._id } } }
            )
            console.log(empInDep);
        }
        return res.redirect('/viewEmployees');
    } catch (err) {
        console.log(err);
    }
    return res.redirect('/viewEmployees');
})

// updating form
app.get('/updateEmployee/:id', async (req, res) => {
    const employeeId = req.params.id;
    try {
        const employee = await Employee.findOne({ _id: employeeId }).exec();
        if (employee) {
            return res.render('updateData', { employee: employee });
        }
    } catch (err) {
        console.log(err);
    }
    res.render('index');
})


// updating the data
app.post('/updateEmployee/:id', async (req, res) => {
    const id = req.params.id;
    const { newName, newSurname, newDepartment } = req.body;
    try {
        const updatedEmp = await Employee.findByIdAndUpdate(
            id,
            {
                name: newName,
                surname: newSurname,
                department: newDepartment
            },
            { new: false }
        );
        console.log(updatedEmp);
        if (updatedEmp) {
            const oldDepartment = await Department.findOne({ departmentName: updatedEmp.department }).exec();
            // Remove employee from old department
            oldDepartment.employeeNames = oldDepartment.employeeNames.filter(emp => emp._id.toString() !== id);
            // oldDepartment.employeeNames.findByIdAndDelete({ _id: id });
            // Find the new department
            const newDepar = await Department.findOne({ departmentName: newDepartment }).exec();
            // Add employee to new department
            newDepar.employeeNames.push({ _id: id, name: newName, surname: newSurname });
            // Save both departments
            await oldDepartment.save();
            await newDepar.save();
            // redirect to the view employee page again
            return res.redirect('/viewEmployees');
        }
    } catch (err) {
        console.log(err);
    }
    return res.redirect('/viewEmployees');
})





mongoose.connection.once('open', () => {
    console.log('Connect to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server listening on ${PORT}`);
    });
})