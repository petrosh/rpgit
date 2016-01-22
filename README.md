# rpgit
rpgitd

- Preview: http://127.0.0.1/~petrosh/RPGIT/rpgit/
- References: https://developer.github.com/v3/git/refs/

# index.html readings

## Data

- owner.type = "Organization"
  - created_at: game started
  - forks: players

- owner.type = "User"
  - created_at: joined game

## Auth

**Connected on page you don't own**

- permission.admin = false
  - owner.type = "Organization" **Player visiting game**
  - owner.type = "User" **Player in other player's page**

**Connected on page you own**

- permissions.admin = true
  - owner.type = "Organization" **GM connected as Master**
  - owner.type = "User" **Player connected**

# admin, pull, push

- original https://github.com/Fork-n-Play/rpgit

  - owner.type = Organization
  - {true, true, true} from Fork-n-Play
  - {false, false, pull: true} from trasparente

- owner fork http://petrosh.github.io/rpgit/

  - owner.type = User
  - {true, true, true} from petrosh
  - {false, false, pull: true} from trasparente

- player fork http://trasparente.github.io/rpgit/

  - owner.type = User
  - {admin: false, push: false, pull: true} from petrosh

# if is a fork

- `parent` is the repository this repository was forked from.
- `source` is the ultimate source for the network.
