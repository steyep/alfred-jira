# Alfred-Jira
This is a workflow for Alfred 2 (or Alfred 3) that can be used to interact with [JIRA](http://www.atlassian.com/jira).
![Alt text](https://github.com/steyep/alfred-jira/raw/master/resources/demo.gif)
## Installation 
* [Install Node.js](https://nodejs.org/en/download/package-manager/) (`>=6.0.0`).
* Clone/fork this repo
* Run the build script `npm run build`

## Features
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
* View an issue's priority
* Watch/Unwatch an issue
* Effortlessly track time-spent on an issue
  * When viewing an issue's details in **Alfred**, you can start/stop progress on a given issue
    * **Starting** progress will move the issue to the main menu for quick access and begin automatically tracking time.
    * **Stopping** progress will log the time spent on an issue to JIRA as well as the exact time/date you began working on the issue.
* Open issue in a web browser

## Settings
#### Projects & Statuses
After installing the workflow and logging in, an array of all available _projects_ and _statuses_ will be created. It is recommended that you edit this list to give you better results. For example: removing `Closed` from the list of enabled statuses. 

This can be easily done by selecting `Edit Settings` from the `Settings` menu and removing unwanted statuses/projects from the `available_projects` and `available_issues_statuses` arrays. 
#### Minimum Log Time
When logging time to issues, you may wish to set a minimum amount of time to log. A minimum can be set by adding `minimum_log_time` to the config file. The format for the minimum value is similar to the format used in JIRA:

  ```
  "minimum_log_time": ".5 h",
  ```

  ```
  "minimum_log_time": "30m",
  ```
Both examples above will always log a minimum of `30 minutes` to issues you work on. 
#### Customizing
By default, all items associated with a specific issue will be returned when viewing an issue's details. You can specify which items are returned so that the information that is pertinent to you is easily accessible. To enable _all_ items, open the settings file, and add the following array to the `options`:

  ```
  "enabled_menu_items": [
      "summary",
      "description",
      "progress",
      "assignee",
      "status",
      "comment",
      "watch",
      "priority"
    ],
  ```
Clearing the workflow settings and logging in will restore the defaults.

## Security
In order to authenticate against the JIRA API, your username/password will be required. They will be saved in **Keychain Access**  under the name `alfred-jira`. Additionally, a configuration file will be created at `~/.alfred-jira`. Both can be removed by selecting **Clear workflow settings** from the `settings` menu.

## Performance
For better performance, some information is persisted in `~/.alfred-jira`:

* The tickets assigned to you will persist for 15 minutes. 
* The list of users will persist for 7 days
* The list of available transitions will persist for 45 seconds
* The list of search results will persist for 45 seconds
* Update status will persist for 24 hours (unless an update **is** available – in which case the workflow stops checking for updates).

## Optional
You can download the image resources associated with the workflow's enabled projects, users, and priority levels by running `npm run download-all-images` or you can selectively download resources by running the scripts individually: 

  ```
  npm run download-project-icons
  npm run download-user-avatars
  npm run download-priority-icons
  ```