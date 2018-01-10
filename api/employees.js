const employeesRouter = require('express').Router();
const timesheetsRouter = require('./timesheets');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get('SELECT * FROM Employee WHERE id = $id', { $id: employeeId }, (error, employee) => {
    if (error) {
      next (error); // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      if (employee) {
        req.employee = employee;
        next();
      } else {
        res.status(404).send();
      }
    }
  });  //end db.get
});  // end employeesRouter.param

employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE is_current_employee = 1', (error, employees) => {
    if (error) {
      next (error); // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      res.status(200).send({ employees: employees });
    }
  });  // end db.all
});  // end employeesRouter.get

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).send({ employee: req.employee });
});  // end employeesRouter.get - id

employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = Number(req.body.employee.wage);
  if (!name || !position || !wage) {
    res.status(400).send();
  } else {
    const insertSql = 'INSERT INTO Employee ( name, position, wage ) VALUES ( $name, $position, $wage )';
    const insertValues = { $name: name, $position: position, $wage: wage };
    db.run(insertSql, insertValues, function (error) {
      if (error) {
        next (error);  // pass the error along the middleware chain to be dealt with by errorhandler
      } else {
        db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (error, employee) => {
          if (error) {
            next (error);
          } else {
            res.status(201).send({ employee: employee });
          }
        });  // end db.get
      }
    });  // end db.run
  }
}); // end employeesRouter.post

employeesRouter.put('/:employeeId', (req, res, next) => {
  const id = req.params.employeeId;
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = Number(req.body.employee.wage);
  if (!name || !position || !wage ) {
    res.status(400).send();
  } else {
    updateSql = 'UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id';
    updateValues = { $id: id, $name: name, $position: position, $wage: wage };
    db.run(updateSql, updateValues, function (error) {
      if (error) {
        next (error);  // pass the error along the middleware chain to be dealt with by errorhandler
      } else {
        db.get('SELECT * FROM Employee WHERE id = $id', { $id: id }, (error, employee) => {
          if (error) {
            next (error);
          } else {
            res.status(200).send({ employee: employee });
          }
        });  // end db.get
      }
    });  // end db.run
  }
}); // end employeesRouter.put

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const id = req.params.employeeId;
  const deleteSql = 'UPDATE Employee SET is_current_employee = 0 WHERE id = $id';
  db.run(deleteSql, { $id: id }, function (error) {
    if (error) {
      next (error);  // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      db.get('SELECT * FROM Employee WHERE id = $id', { $id: id }, (error, employee) => {
        if (error) {
          next (error);
        } else {
          res.status(200).send({ employee: employee });
        }
      });  // end db.get
    }
  });  // end db.run
}); // end employeesRouter.delete

module.exports = employeesRouter;
