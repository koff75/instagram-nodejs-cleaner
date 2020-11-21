require('dotenv').config()
const {
  IgApiClient,
  IgLoginTwoFactorRequiredError,
  LikedFeed
} = require('./node_modules/instagram-private-api/dist/index.js')
const {
  MediaRepository
} = require('./node_modules/instagram-private-api/dist/repositories/media.repository')
const ig = new IgApiClient()
ig.state.generateDevice(process.env.IG_USER)


// Helper function to loop through items
async function getAllItemsFromFeed(feed) {
  let items = [];
  do {
    items = items.concat(await feed.items());
  } while (feed.isMoreAvailable());
  return items;
}

const massUncomment = async (feed) => {
  const items = await feed.items().catch(
    (err) => {
      console.log(err);
    })
  console.log("PASSAGE");

  console.log(items);

  //hasErrored = false;
  //if (feed.isMoreAvailable && !hasErrored) {
  //console.log("ok");
  //   const items = await feed.items().catch(
  //     (err) =>{console.log(err);
  //     } 
  //   )

  //   // const [ firstThread ] = await ig.feed.directInbox().items();
  // // to delete everything you'd have to get the directThread-feed
  // await Promise.all(
  //   items.map((item) => 
  //   { 
  //     //console.log(item);
  //     // Supprime son dernier mess d'un convers. Bug si le dernier mess est pas le sien.
  //     //ig.entity.directThread(item.thread_id).deleteItem(item.last_permanent_item.item_id)
  //   }
  //   )
  // );
  //}

}

const massUnlike = async (feed) => {
  hasErrored = false;

  if (feed.isMoreAvailable && !hasErrored) {
    const items = await feed.items()
    for (let i = 0; i < items.length; i++) {
      ig.media.unlike({
        mediaId: items[i].id,
        moduleInfo: {
          module_name: 'media_view_profile',
        }
      }).catch(e => {
        console.log("ERREUR FONCTION MASSUNLIKE")
        console.error(e)
        hasErrored = true
      })
      console.log(`Unlike - ${i+1}/${items.length}`);
    }
  }
}

const compareFollowers = async (followers, nameFile) => {
  const itemsFollowers = await getAllItemsFromFeed(followers); // followers == feed
  //const itemsFollowers = await followers.items()
  // We push all username to an array. Easier for savings
  var liveFollowersArray = []; // Array with all new users
  for (let i = 0; i < itemsFollowers.length; i++) {
    if (itemsFollowers[i].username != undefined) {
      liveFollowersArray.push(itemsFollowers[i].username);
    }
  }

  var fs = require('fs');
  // File creation from an initialisation
  if (!fs.existsSync(nameFile)) {
    console.log(`=== ${nameFile} === \n File creation of ${nameFile} \n ...saving file with new informations...`);
    fs.writeFile(nameFile, JSON.stringify(liveFollowersArray, null, 1), function (err) {
      if (err) {
        console.log(`Error writing file! \n ${err}`);
      }
    });
  } else { // READING FILE
    fs.readFile(nameFile, function (err, data) {
      if (err) {
        console.log(`Error reading file! \n ${err}`);
      }
      data = JSON.parse(data); // contains the users values from the saved file
      console.log(`=== ${nameFile} === \nCount from file ${data.length}`);
      // Diff count from the old array and the file array
      if (liveFollowersArray.length != data.length) {
        console.log("Number of followers is different !");
        /* == CHECKING DIFFERENCES == */
        // new followers
        for (let i = 0; i < liveFollowersArray.length; i++) {
          if (!data.includes(liveFollowersArray[i])) console.log(`New follow : ${liveFollowersArray[i]}`);
        }
        // removed followers
        for (let i = 0; i < data.length; i++) {
          if (!liveFollowersArray.includes(data[i])) console.log(`Unfollowed : ${data[i]}`);
        }
        // WRITING NEW FILE
        console.log(`=== ${nameFile} === \n ...saving file with new informations...`);
        fs.writeFile(nameFile, JSON.stringify(liveFollowersArray, null, 1), function (err) {
          if (err) {
            console.log(`Error writing file! \n ${err}`);
          }
        });
      } else {
        console.log("At this time, same number of followers !");
      }
    })
  }
}

const youDontFollowMe = () => {
  var fs = require('fs');
  var followersRes = [];
  var followingRes = [];

  // Be careful, it's async await, so followers need to wait...
  const followers = JSON.parse(fs.readFileSync('followers.txt', {
    encoding: 'utf8',
    flag: 'r'
  }));
  const following = JSON.parse(fs.readFileSync('following.txt', {
    encoding: 'utf8',
    flag: 'r'
  }));

  for (let i = 0; i < followers.length; i++) {
    if (!following.includes(followers[i])) {
      followersRes.push(followers[i])
    }
  }
  for (let i = 0; i < following.length; i++) {
    if (!followers.includes(following[i])) {
      followingRes.push(following[i])
    }
  }
  console.log("==========================");
  console.log("You are not following back");
  console.log("==========================");
  followersRes.map(res => console.log(res))
  console.log("==========================");
  console.log("Not following you back");
  console.log("==========================");
  followingRes.map(res => console.log(res))



}

const getTopLikerPhotos = async (feed) => {
  const items = await getAllItemsFromFeed(feed);
  // items.top_likers => array with 3 strings
  // items.media_id => string
  const myUserList = {
    users: []
  };
  // Looping on each pic from our insta library
  for (let i = 0; i < items.length; i++) {
    // items == the id of our list of media
    // checking the likers of the specific media

    console.log(`=== Current media : ${i+1}/${items.length}`);

    let likers = await ig.media.likers(items[i].pk)


    // Looping on each user who like the pic to check if it exists in our list
    // We add a point if so, else if we create the line on our myUserList
    for (let i = 0; i < likers.users.length; i++) {
      // If the user from our list exist in the post likes
      // If so, we increment the counter to the user, else if we push the user to our list
      if (myUserList.users.some(person => person.username === likers.users[i].username)) {
        // console.log('+1');
        myUserList.users.map(person => (person.username === likers.users[i].username) ? person.count++ : "")
      } else {
        // console.log(`Creation de ${likers.users[i].username}!`);
        myUserList.users.push({
          "username": likers.users[i].username,
          "full_name": likers.users[i].full_name,
          "profile_pic_url": likers.users[i].profile_pic_url,
          "count": 1
        })
      }
      // Rank our list by number of likes
      myUserList.users.sort(function (a, b) {
        return b.count - a.count;
      });
    }
  }

  // Writing file with out list informations
  var fs = require('fs');
  // File creation from an initialisation
  if (!fs.existsSync("topUserLikeList.txt")) {
    console.log(`=== "topUserLikeList.txt" === \n File creation of topUserLikeList.txt \n ...saving file with new informations...`);
    fs.writeFile("topUserLikeList.txt", JSON.stringify(myUserList.users, null, 1), function (err) {
      if (err) {
        console.log(`Error writing file! \n ${err}`);
      }
    });
  } // attention pas de cas ou le fichier existe... a fixer.

}


/*
  STARTING THE APP BELOW
*/

var menuHandler;

// Initialize
function initialize() {
  showMain();
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', checkMenu);

  function checkMenu() {
    var input = process.stdin.read();
    if (input !== null) {
      menuHandler(input.trim());
    }
  }
}

// Main
function showMain() {
  console.log(
    '1 = Automatic unlike' + '\n' +
    '2 = Unfollow detection' + '\n' +
    '3 = Following-back compare' + '\n' +
    '4 = Top 20 likers' + '\n' +
    '5 = Exit' + '\n\n' +
    'Choose number, then press ENTER:'
  );

  menuHandler = function (input) {
    switch (input) {
      case '1':
        unlike();
        break;
      case '2':
        compareFollowers_start();
        break;
      case '3':
        compareFollowers2_start();
        break;
      case '4':
        topLikers();
        break;
      case '5':
        process.exit();
        break;
      default:
        showMain();
    }
  };
}
initialize();

// FUNCTIONS
function unlike() {
  ig.account
    .login(process.env.IG_USER, process.env.IG_PASS)
    .catch(e => console.error(e))
    .then(async user => {
      // FIXME: Catch empty feeds
      // https://github.com/dilame/instagram-private-api/blob/master/docs/classes/_core_feed_factory_.feedfactory.md
      // const id = await ig.user.getIdByUsername("xxx");
      // const feed = ig.feed.user(id);
      // const list = await feed.items();
      const likedFeed = ig.feed.liked(user.pk)
      console.log("To bypass Instagram bot detection, the dislike function process by iteration. Leave it processing...a long time :)");
      console.log("When it's enough, press CTRL+C to stop the process !");
      console.log("==== DEBUT =====");
      /* TESTED */
      massUnlike(likedFeed)
      setInterval(() => massUnlike(likedFeed), 400 * 100)

      //youDontFollowMe()

      /* IN DEV */
      //const commentFeed = ig.feed.mediaComments(user.pk)
      //massUncomment(commentFeed);
      //const DMFeed = ig.feed.directInbox(user.pk) // direct message 

      //  const topLikerPhotos = ig.feed.user(user.pk);
      //  getTopLikerPhotos(topLikerPhotos);

      // const blocked = ig.feed.blockedUsers(user.pk);
      // const liste = await getAllItemsFromFeed(blocked);
      // console.log(liste);


      // async function doSomething() {
      //   let result = await ig.user(28401337) // media.likers("2021803171904742023")
      //   return console.log(result);
      // }
      // doSomething();
    })
}

function compareFollowers_start() {
  ig.account
    .login(process.env.IG_USER, process.env.IG_PASS)
    .catch(e => console.error(e))
    .then(async user => {
      const followers = ig.feed.accountFollowers(user.pk)
      const following = ig.feed.accountFollowing(user.pk)
      console.log("==== DEBUT =====");
      compareFollowers(followers, "followers.txt");
      compareFollowers(following, "following.txt");
    })
}

function compareFollowers2_start() {
  ig.account
    .login(process.env.IG_USER, process.env.IG_PASS)
    .catch(e => console.error(e))
    .then(async user => {
      console.log("Note: The first time, we just save to data. Come back later & execute the script again, it checks the differences.");
      console.log("==== DEBUT =====");
      youDontFollowMe()
    })
}

function topLikers() {
  ig.account
    .login(process.env.IG_USER, process.env.IG_PASS)
    .catch(e => console.error(e))
    .then(async user => {
      console.log("==== DEBUT =====");
      const topLikerPhotos = ig.feed.user(user.pk);
      getTopLikerPhotos(topLikerPhotos).then(() => {
            /* Show the top 10 likers !! */

      /* LOGGING */
      var fs = require('fs');
      const nameFile = "topUserLikeList.txt";
      if (!fs.existsSync(nameFile)) {
        console.log(`=== ${nameFile} === \n File creation of ${nameFile} \n`);
        fs.writeFile(nameFile, JSON.stringify(liveFollowersArray, null, 1), function (err) {
          if (err) {
            console.log(`Error writing file! \n ${err}`);
          }
        });
      } else { // READING FILE
        fs.readFile(nameFile, function (err, data) {
          if (err) {
            console.log(`Error reading file! \n ${err}`);
          }
          data = JSON.parse(data);
          console.log("==== DEBUT =====");
          console.log("==== TOP 20 LIKERS =====");
          for (let i = 0; i < 20; i++) {
            console.log(`${i+1} : ${data[i].full_name} - ${data[i].username} - ${data[i].count} likes.`);
          }
        })
      }
      })
    })
}