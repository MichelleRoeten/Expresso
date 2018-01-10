const timesheetsRouter = require('express').Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', { $timesheetId: timesheetId }, (error, timesheet) => {
    if (error) {
      next (error); // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      if (timesheet) {
        req.timesheet = timesheet;
        next();
      } else {
        res.status(404).send();
      }
    }
  });  //end db.get
});  // end timesheetsRouter.param

timesheetsRouter.get('/', (req, res, next) => {
  const employeeId = req.params.employeeId;
  db.all('SELECT * FROM Timesheet WHERE employee_id = $employeeId', { $employeeId: employeeId }, (error, timesheets) => {
    if (error) {
      next (error); // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      res.status(200).send({ timesheets: timesheets });
    }
  });  // end db.all
});  // end timesheetsRouter.get

timesheetsRouter.post('/', (req, res, next) => {
  const employeeId = req.params.employeeId;
  const hours = Number(req.body.timesheet.hours);
  const rate = Number(req.body.timesheet.rate);
  const date = Number(req.body.timesheet.date);
  if (!hours || !rate || !date || !employeeId) {
    res.status(400).send();
  } else {  // check for  valid employee ID
    db.get('SELECT * FROM Employee WHERE id = $employeeId', { $employeeId: employeeId }, (error, employee) => {
      if (error) {
        next (error);
      } else if (employee === undefined) {
        res.status(400).send();
      } else {
        const insertSql = 'INSERT INTO Timesheet (hours, rate, date, employee_id ) ' +
                           'VALUES ($hours, $rate, $date, $employeeId)';
        const insertValues = { $hours: hours, $rate: rate, $date: date, $employeeId: employeeId };
          db.run(insertSql, insertValues, function(error) {
          if (error) {
            next (error);
          } {
            db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`, (error, timesheet ) => {
              if (error) {
                next (error);
              } else {
                res.status(201).send({ timesheet: timesheet});
              }
            }); // end db.get for Timesheet
          }
        }); // end db.run
      }  // end else from the employee check
    });  // end db.get for Employee
  }  // end check for valid employee ID
}); // end timesheetsRouter.post

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const employeeId = req.params.employeeId;
  const timesheetId = req.params.timesheetId;
  const hours = Number(req.body.timesheet.hours);
  const rate = Number(req.body.timesheet.rate);
  const date = Number(req.body.timesheet.date);
  if (!hours || !rate || !date || !employeeId) {
    res.status(400).send();
  } else {
    db.get('SELECT * FROM Employee WHERE id = $employeeId', { $employeeId: employeeId}, (error, employee) => {
      if (error) {
        next (error);
      } else {
        if (employee === undefined) {  // an employee with the specified ID does not exist
          res.status(404).send();
        } else {
          db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', { $timesheetId: timesheetId }, (error, timesheet) => {
            if (error) {
              next (error);
            } else {
              if (timesheet === undefined) { // a timesheet with the specified ID does not exist
                res.status(404).send();
              } else {
                const updateSql = 'UPDATE Timesheet SET ' +
                                   'hours = $hours, ' +
                                   'rate = $rate, ' +
                                   'date = $date, ' +
                                   'employee_id = $employeeId ' +
                                  'WHERE id = $timesheetId';
                const updateValues = { $hours: hours, $rate: rate, $date: date, $employeeId: employeeId, $timesheetId: timesheetId };
                db.run(updateSql, updateValues, function(error) {
                  if (error) {
                    next (error);
                  } else {
                    db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', { $timesheetId: timesheetId }, (error, timesheet) => {
                      if (error) {
                        next (error);
                      } else {
                        res.status(200).send( { timesheet: timesheet} );
                      }
                    });  // end db.get after update
                  }
                });  // end db.run
              }
            }
          })  // end db.get for Timesheet - check to see if timesheet with specified ID exists
        }
      }
    });  // end db.get for Employee
  }
}); // end timesheetsRouter.put

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const timesheetId = req.params.timesheetId;
  const employeeId = req.params.employeeId;
  db.get('SELECT * FROM Employee WHERE id = $employeeId', { $employeeId: employeeId }, (error, employee) => {
    if (error) {
      next (error);
    } else {
      if (employee === undefined) {
        res.status(404).send();  // employee not found
      } else {
        db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', { $timesheetId: timesheetId }, (error, timesheet) => {
          if (error) {
            next (error);
          } else {
            if (timesheet === undefined) {
              res.status(404).send();  // timesheet not found
            } else {
              db.run('DELETE FROM Timesheet WHERE id = $timesheetId', { $timesheetId: timesheetId }, function(error) {
                if (error) {
                  next (error);
                } else {
                  res.status(204).send();
                }
              });
            }
          }
        });
      }
    }
  }); //end db.get for Employee table
}); // end timesheetsRouter.delete


module.exports = timesheetsRouter;
