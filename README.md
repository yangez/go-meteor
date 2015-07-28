# Online Go server

Play at **http://onlinego.net**

To contribute:
1. Install meteor with `curl https://install.meteor.com/ | sh`. You can run it locally with `meteor` in this directory
2. Create a new issue (including how to reproduce) for new stuff
3. If you're working on code, submit a PR with issue # attached

To deploy live:
1. Set up your SSH key in ~/.ssh
2. Send Eric your public key and get `mup.json` from him to add to your working directory
3. `npm install -g mup` on your computer
4. Go to our directory and make your changes.
5. `mup deploy` pushes it to production. Only use this on up-to-date `master` branch please.

Cheers!
