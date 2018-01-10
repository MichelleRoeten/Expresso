const menusRouter = require('express').Router();
const menuItemsRouter = require('./menu-items');
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.param('menuId', (req, res, next, menuId) => {
  db.get('SELECT * FROM Menu WHERE id = $menuId', { $menuId: menuId }, (error, menu) => {
    if (error) {
      next (error); // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      if (menu) {
        req.menu = menu;
        next();
      } else {
        res.status(404).send();
      }
    }
  });  //end db.get
});  // end menusRouter.param

menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (error, menus) => {
    if (error) {
      next (error); // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      res.status(200).send({ menus: menus });
    }
  });  // end db.all
});  // end menusRouter.get

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).send({ menu: req.menu });
});  // end menusRouter.get - id

menusRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    res.status(400).send();
  } else {
    const insertSql = 'INSERT INTO Menu ( title ) VALUES ( $title )';
    const insertValues = { $title: title };
    db.run(insertSql, insertValues, function (error) {
      if (error) {
        next (error);  // pass the error along the middleware chain to be dealt with by errorhandler
      } else {
        db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (error, menu) => {
          if (error) {
            next (error);
          } else {
            res.status(201).send({ menu: menu });
          }
        });  // end db.get
      }
    });  // end db.run
  }
}); // end menusRouter.post

menusRouter.put('/:menuId', (req, res, next) => {
  const id = req.params.menuId;
  const title = req.body.menu.title;
  if (!title ) {
    res.status(400).send();
  } else {
    db.get('SELECT * FROM Menu WHERE id = $id', { $id: id }, (error, menu) => {
      if (error) {
        next (error);
      } else {
        if (!menu) {
          res.status(404).send();
        } else {
          updateSql = 'UPDATE Menu SET title = $title WHERE id = $id';
          updateValues = { $id: id, $title: title };
          db.run(updateSql, updateValues, function (error) {
            if (error) {
              next (error);  // pass the error along the middleware chain to be dealt with by errorhandler
            } else {
              db.get('SELECT * FROM Menu WHERE id = $id', { $id: id }, (error, menu) => {
                if (error) {
                  next (error);
                } else {
                  res.status(200).send({ menu: menu });
                }
              });  // end db.get to return ukpdated menu
            }
          });  // end db.run
        }
      }
    });  // end db.get to check for menu with specified ID
  }
}); // end menusRouter.put

menusRouter.delete('/:menuId', (req, res, next) => {
  const id = req.params.menuId;
  db.get('SELECT * FROM Menu WHERE id = $id', { $id: id }, (error, menu) => {
    if (error) {
      next (error);
    } else {
      if (menu === undefined) {
        res.status(404).send();  // a menu with the specified menu ID does not exist
      } else {
        db.get('SELECT * FROM MenuItem WHERE menu_id = $id', { $id: id }, (error, menuItem) => {
          if (error) {
            next (error);
          } else {
            if (menuItem) {
              res.status(400).send();  // can't delete because menu items are attached
            } else {
              db.run('DELETE FROM Menu WHERE id = $id', { $id: id }, function(error) {
                if (error) {
                  next (error);
                } else {
                  res.status(204).send();
                }
              });  // end db.run
            }
          }
        });  // end db.get to check for menu Item(s) with the specified Menu ID
      }
    }
  });  // end db.get to check for menu with hte specified menu ID
}); // end menusRouter.delete

module.exports = menusRouter;
