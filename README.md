# instagram-cleaner in Node.js
- Automatic mass unlike on your whole account since his creation !
- Unfollow detection, can show the new / lost followers & new / lost followings !
- Show who is not following you, and who you are not following back !
- Show your top 20 followers ranked by number of likes !

### How to use
1. Clone this repository
2. Run `npm install` to install the node_modules.
3. Create a new files '.env' file with your Instagram credentials exactly like this (replace <username> by your instagram username and same thing for <password>):
```
IG_USER=<username>
IG_PASS=<password>
```
4. It should be automatic, but in case create some empty files: 'followers.txt', 'following.txt', 'topUserLikeList.txt'.
5. run `node app` in your terminal or use a service like `pm2` on a server to run the program forever with `pm2 start app.js`. If you've skipped step 2 add `IG_USER=<username> IG_PASS=<password>` to your command 

Instagram has a rate limit of 200 requests per hour. Therefore mass unlike unlikes 21 posts every 400s (~6.7 minutes) or 189 posts per hour.
