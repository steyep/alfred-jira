# Alfred-Jira
This is a workflow for Alfred 2 (or Alfred 3) that can be used to interact with [JIRA](http://www.atlassian.com/jira).
![Alt text](https://github.com/steyep/alfred-jira/raw/master/resources/demo.gif)
## Installation 
* [Install Node.js](https://nodejs.org/en/download/package-manager/) (`>=6.0.0`).
* Clone/fork this repo
* Run the build script `npm run build`

## Features
* Quickly create new issues.
  * **Project** and **Issue Type** fields are required and must be defined before submitted the summary.
  * The summary can contain multiple periods (`.`) but the last character in the summary *must* be a period in order to submit the new issue. This is a precaution used to prevent premature submission of new issues.
  * Default values for "Assignee," "Project," and "Issue Type" are configurable in the settings pane to make issue creation even easier.
  * **Alfred 3** users can `cmd + enter` when submitting the issue to open the newly created issue in the browser.
* Create "bookmarks" of custom JQL search queries that allow the user to quickly return a list of issues that meet the defined criteria.
  * By default, `alfred-jira` has two bookmarks for **issues assigned to you** and **issues that you are watching**.
* Easily filter your bookmark results by *any* string in the issue (including `status`, `reporter`, etc).
  * `jira` followed by the search string will search all of your bookmark results
  * The same can be done within a bookmark menu but will limit the search to the menu you are currently on.
  * Wildcards and Regular Expressions are valid search strings
* Search JIRA
  * Returns a list of JIRA issues that contain the search string in the **summary**, **description**, or **comments**
  * Allows for advanced searching using JQL
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

## Keywords
* `jira` starts the workflow and allows the user to navigate through the menus/search issues
* `jiraopen` – Short cut for opening an issue in the browser. The issue key must be given as a parameter:
  * `jiraopen ABC-123`
* `jiraclear` – Clears the progress timer for an issue ***without*** logging the time to JIRA.

## Settings
#### Projects & Statuses
After installing the workflow and logging in, the workflow will default to include all projects and statuses available in your JIRA instance. It is recommended that you open the settings pane and configuring the workflow to show only the projects and issue statuses that you are interested in. For example: disabling `Done` and `Closed` issue statuses.

This can be easily done by selecting `Edit Settings` from the `Settings` menu and clicking the buttons associated with the statuses you wish to disable/enable.
#### Minimum Log Time
When logging time to issues, you may wish to set a minimum amount of time to log. A minimum can be set by adding the desired amount of time to the "**minimum time to log**" field of the settings pane. The format for time is the same as in JIRA: `.5 h` and `30m` both log a minimum of `30 minutes` to issues you work on.
#### Rounding Log Time
It is possible to define an increment with which to round your log time by defining "**Round time to the nearest increment**" in the settings pane. Doing so will round your time spent on an issue to the nearest `increment` defined. For example: with `15 mins` increments, `1 hour 51 minutes` spent on an issue would be logged as `2 hours`. Note that the format of the value is the same as described in the *Minimum Log Time* section.
#### Searching
By default, the workflow is set up to perform a *basic* search. Meaning, from the search option, Alfred will return a list of issues that contain the string(s) you typed in their summary, description, or comment fields. If you would prefer more control over the search, you can enable [JQL searching](https://confluence.atlassian.com/jirasoftwarecloud/advanced-searching-764478330.html) by ticking the "**Advanced Search (JQL)**" under the **Settings** header of the settings pane.
#### Customizing
By default, all items associated with a specific issue will be returned when viewing an issue's details. You can specify which items are returned so that the information that is pertinent to you is easily accessible. Enable/disable menu items from the settings pane.

## Optional
You can download the image resources associated with the workflow's enabled projects, users, and priority levels via the buttons at the bottom of the settings pane under the **Optional** header. 

## Security
In order to authenticate against the JIRA API, your username/password will be required. They will be saved in **Keychain Access**  under the name `alfred-jira`. Additionally, a configuration file will be created at `~/.alfred-jira`. Both can be removed by selecting **Logout** from the settings pane.

## Performance
For better performance, some information is persisted in `~/.alfred-jira`:

* The list of users will persist for 7 days
* The list of available transitions will persist for 45 seconds
* The list of search results will persist for 45 seconds
* Update status will persist for 24 hours (unless an update **is** available – in which case the workflow stops checking for updates).

You also have the ability to enable *background cacheing* by selecting "**Refresh workflow cache in the background**" in the settings pane. Once you specify a time interval and save the settings, the app will create a LaunchAgent file (`$HOME/Library/LaunchAgents/com.alfred-jira.helper.plist`) that will keep your issues synced with the server so that you don't experience any lag when navigating your bookmark queries. The LaunchAgent only runs when it can connect to your Jira instance and is disabled when your credentials are invalid to prevent an accidental account lockout.
