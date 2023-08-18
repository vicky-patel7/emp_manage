const { Employee, Department } = require("../src/db/models");

const addEmployeeData = async (req, res) => {
    console.log(req.body);
    const {firstname, surname, department} = req.body;
    try {
        existingEmployee = await Employee.findOne({name : firstname, surname : surname, department : department});
        if(existingEmployee) {
            throw new Error(`Employee ${firstname} ${surname} already exists`);
        }
        const departmentDoc = await Department.findOne({department : department});
        console.log(departmentDoc);
        const employeeData = {
            name : firstname,
            surname : surname,
            department : department
        }
        if(departmentDoc === null) {
            departmentDoc = await Department.create({
                department : department
            })
            departmentDoc.employeeNames.push(employeeData);
        }else {
            var employeeExistInDep = departmentDoc.employeeNames.some(emp => {
                emp.name === firstname && emp.surname === surname
            });
        }
        if(employeeExistInDep) {
            throw new Error(`Employee ${firstname} already exists in ${departmentDoc} department`);
        }
        await departmentDoc.save();
        const newEmployee = new Employee(employeeData);
        await newEmployee.save();
        res.send('Employee Added Success')
    }catch(err) {
        console.log(err);
        next(err)
    }
}
module.exports = addEmployeeData;