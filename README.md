## Alfred-Jira
This is a workflow for Alfred 2 (or Alfred 3) that can be used to interact with [JIRA](http://www.atlassian.com/JIRA‎).
![Alt text](https://github.com/steyep/alfred-jira/raw/master/resources/demo.gif)
### Installation: 
* [Install Node.js](https://nodejs.org/en/download/package-manager/) (if not already installed).
* Clone/fork this repo
* Run the install script `sh ./install.sh`

### Features:
* List issues assigned to you
  * Returns a list of issues that are currently assigned to you
* List issues that you are "watching"
  * Returns a list of JIRA issues that you are currently watching
  * Ordered in descending order of when they were last updated
* Search JIRA
  * Returns a list of JIRA issues that contain the search string in the **summary**, **description**, or **comments**
  * Ordered in descending order by priority and then by issue name.
* Assign an issue
  * Presents a list of assignable users for a given issue
* Transition the status of an issue
  * Presents a list of available transitions for a given issue
  * When a *transition* is selected, a browser window will open allowing you to set a resolution, assignee, comment, et cetera before actually submitting the change. 
* Quickly add a comment to an issue
  * Within **Alfred**, simply select "Add a comment" for a given issue (by tabbing/pressing enter) and type the comment. Pressing `enter` will POST the comment to the issue. 
* View an issue's *priority*
* Watch/Unwatch an issue
* Open issue in a web browser

### Settings:
After installing the workflow and logging in, an array of all available _projects_ and _statuses_ will be created. It is recommended that you edit this list to give you better results. For example: removing `Closed` from the list of enabled statuses. 

This can be easily done by selecting `Edit Settings` from the `Settings` menu and removing unwanted statuses/projects from the `available_projects` and `available_issues_statuses` arrays. 

Clearing the workflow settings and logging in will restore the defaults.

### Security:
In order to authenticate against the JIRA API, your username/password will be required. They will be saved in **Keychain Access**  under the name `alfred-jira`. Additionally, a configuration file will be created at `~/.alfred-jira`. Both can be removed by selecting **Clear workflow settings** from the `settings` menu.

### Performance: 
For better performance, some information is persisted in `~/.alfred-jira`:

* The tickets assigned to you will persist for 15 minutes. 
* The list of users will persist for 7 days
* The list of available transitions will persist for 45 seconds
* The list of search results will persist for 45 seconds
* Update status will persist for 24 hours (unless an update **is** available – in which case the workflow stops checking for updates).

### Optional:
You can download the image resources associated with the workflow's enabled projects, users, and priority levels by running `npm run download-all-images` or you can selectively download resources by running the scripts individually: 

  ```
  npm run download-project-icons
  npm run download-user-avatars
  npm run download-priority-icons
  ```