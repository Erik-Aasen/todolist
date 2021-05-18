const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
var config = require(__dirname + "/config.js");

const app = express();


// const items = ["item1", "item2", "item3"];
const workItems = ["workItem1", "WorkItem2"];


app.use(express.urlencoded()); //parse URL encoded bodies
app.set('view engine', 'ejs'); // for ejs
app.use(express.static("public")); //tells express to serve up the files in public folder

var dbURI = process.env.DB_URI;

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then((result) => console.log('connected to db'))
  .catch((err) => console.log(err))

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "item1"
})

const item2 = new Item({
  name: "item2"
})

const item3 = new Item({
  name: "item3"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

const day = date.getDate();
const dayMonth = date.getDayMonth();
const fullDate = day + ", " + dayMonth;

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully logged default items to DB");
          res.redirect("/")
        }
      })

    } else {
      res.render("list", {
        listTitle: fullDate,
        items: foundItems
      })
    }
  })
})

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save(() => res.redirect("/" + customListName));
      } else {
        res.render("list", {
          listTitle: customListName,
          items: foundList.items
        })
      }
    }
  })


})


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === fullDate) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
})

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === fullDate) {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Removed " + checkedItemId);
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }

})

app.get("/about", function(req, res) {
  res.render("about")
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started");
})
