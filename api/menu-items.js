const menuItemsRouter = require('express').Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', { $menuItemId: menuItemId }, (error, menuItem) => {
    if (error) {
      next (error); // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      if (menuItem) {
        req.menuItem = menuItem;
        next();
      } else {
        res.status(404).send();
      }
    }
  });  //end db.get
});  // end menuItemsRouter.param

menuItemsRouter.get('/', (req, res, next) => {
  const menuId = req.params.menuId;
  db.all('SELECT * FROM  MenuItem WHERE menu_id = $menuId', { $menuId: menuId }, (error, menuItems) => {
    if (error) {
      next (error); // pass the error along the middleware chain to be dealt with by errorhandler
    } else {
      res.status(200).send({ menuItems: menuItems });
    }
  });  // end db.all
});  // end menuItemsRouter.get

menuItemsRouter.post('/', (req, res, next) => {
  const menuId = req.params.menuId;
  const menuItemId = req.params.menuItemId;
  const name = req.body.menuItem.name;
  const description = req.body.menuItem.description;
  const inventory = Number(req.body.menuItem.inventory);
  const price = Number(req.body.menuItem.price);
  if (!name || !inventory || !price ) {
    res.status(400).send();
  } else {  // check for  valid menu ID
    db.get('SELECT * FROM Menu WHERE id = $menuId', { $menuId: menuId }, (error, menu) => {
      if (error) {
        next (error);
      } else if (menu === undefined) {
        res.status(400).send();
      } else {
        const insertSql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id ) ' +
                           'VALUES ($name, $description, $inventory, $price, $menuId)';
        const insertValues = { $name: name, $description: description,
                               $inventory: inventory, $price: price, $menuId: menuId };
          db.run(insertSql, insertValues, function(error) {
          if (error) {
            next (error);
          } {
            db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (error, menuItem ) => {
              if (error) {
                next (error);
              } else {
                res.status(201).send({ menuItem: menuItem });
              }
            }); // end db.get for MenuItem
          }
        }); // end db.run
      }  // end else from the menu check
    });  // end db.get for Menu
  }  // end check for valid menu ID
}); // end menuItemsRouter.post

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const menuId = req.params.menuId;
  const menuItemId = req.params.menuItemId;
  const name = req.body.menuItem.name;
  const description = req.body.menuItem.description;
  const inventory = Number(req.body.menuItem.inventory);
  const price = Number(req.body.menuItem.price);
  if (!name || !inventory || !price ) {
    res.status(400).send();
  } else {
    db.get('SELECT * FROM Menu WHERE id = $menuId', { $menuId: menuId}, (error, menu) => {
      if (error) {
        next (error);
      } else {
        if (menu === undefined) {  // a menu with the specified ID does not exist
          res.status(404).send();
        } else {
          db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', { $menuItemId: menuItemId }, (error, menuItem) => {
            if (error) {
              next (error);
            } else {
              if (menuItem === undefined) { // a menu item with the specified ID does not exist
                res.status(404).send();
              } else {
                const updateSql = 'UPDATE MenuItem SET ' +
                                   'name = $name, ' +
                                   'description = $description, ' +
                                   'inventory = $inventory, ' +
                                   'price = $price, ' +
                                   'menu_id = $menuId ' +
                                  'WHERE id = $menuItemId';
                const updateValues = { $name: name, $description: description, $inventory: inventory,
                                       $price: price, $menuId: menuId, $menuItemId: menuItemId };
                db.run(updateSql, updateValues, function(error) {
                  if (error) {
                    next (error);
                  } else {
                    db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', { $menuItemId: menuItemId }, (error, menuItem) => {
                      if (error) {
                        next (error);
                      } else {
                        res.status(200).send( { menuItem: menuItem} );
                      }
                    });  // end db.get after update
                  }
                });  // end db.run
              }
            }
          })  // end db.get for MenuItem - check to see if menu item with specified ID exists
        }
      }
    });  // end db.get for Menu
  }
}); // end menuItemsRouter.put

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const menuItemId = req.params.menuItemId;
  const menuId = req.params.menuId;
  db.get('SELECT * FROM Menu WHERE id = $menuId', { $menuId: menuId }, (error, menu) => {
    if (error) {
      next (error);
    } else {
      if (menu === undefined) {
        res.status(404).send();  // menu not found
      } else {
        db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', { $menuItemId: menuItemId }, (error, menuItem) => {
          if (error) {
            next (error);
          } else {
            if (menuItem === undefined) {
              res.status(404).send();  // menu item not found
            } else {
              db.run('DELETE FROM MenuItem WHERE id = $menuItemId', { $menuItemId: menuItemId }, function(error) {
                if (error) {
                  next (error);
                } else {
                  res.status(204).send();
                }
              });  // end db.run
            }
          }
        });  // end db.get to check for menu item
      }
    }
  }); //end db.get to check for menu
}); // end menuItemsRouter.delete


module.exports = menuItemsRouter;
