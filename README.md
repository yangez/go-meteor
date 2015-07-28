# Online Go server

Play at **http://onlinego.net**

To contribute, please create new issues (including how to reproduce) and then submit PR with issue # attached. (Install meteor with `curl https://install.meteor.com/ | sh` and run it locally with `meteor` in this directory)

To deploy, make sure you have your SSH key set up in ~/.ssh and send it to me so I can add you to Digital Ocean. Then:

1. `npm install -g mup` on your computer
2. Go to our directory and make your changes.
3. `mup deploy` pushes it to production. Only use this on `master` branch please.

Cheers!
