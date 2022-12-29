---
layout: singlepost
title: How to clean email for gmail via app script ?
tags: google gmail
category: tool
---

分享一枚非常实用的 `google app script`，需要的同学可以将其安装于 `https://script.google.com/`；
它支持全自动调度清理任务，清理任务主要根据 `gmail` 中的指定搜索条件。

<!-- more -->

### Feature

* 指定 `gmail` 搜索条件
* 错误/边界条件等自动触发新调度

### Content of App Script


```javascript
// search string to delete
var SEARCH_STRING = 'category:forums'

var TRIGGER_NAME = 'deleteMailWithLoopMode'
var TIMEZONE = 'AEST'

// FREQUENCY of scheduler
var RESUME_FREQUENCY = 10

// MAX: 500
var PAGE_SIZE = 500

function intialize() {
  return
}

function install() {
  ScriptApp.newTrigger(TRIGGER_NAME)
    .timeBased()
    .at(new Date(new Date().getTime() + 1000 * 60 * 2))
    .create()

  ScriptApp.newTrigger(TRIGGER_NAME).timeBased().everyDays(1).create()
}

function uninstall() {
  var triggers = ScriptApp.getProjectTriggers()
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i])
  }
}

function deleteMailImmediately() {
  var NOW = new Date()
  Logger.log('SEARCH: ' + SEARCH_STRING + ' PAGE_SIZE: ' + PAGE_SIZE)

  try {
    var threads = GmailApp.search(SEARCH_STRING, 0, PAGE_SIZE)

    Logger.log('Processing ' + threads.length + ' threads...')
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i]
      var lastMessageDate = thread.getLastMessageDate()

      if (lastMessageDate < NOW) {
        Logger.log('lastMessageDate ' + lastMessageDate)
        thread.moveToTrash()
      } else {
        var messages = GmailApp.getMessagesForThread(threads[i])
        for (var j = 0; j < messages.length; j++) {
          var email = messages[j]
          if (email.getDate() < age) {
            Logger.log('Start to move this mail to trash.')
            email.moveToTrash()
            Logger.log('Mail has been moved to trash.')
          }
        }
      }
    }
  } catch (e) {
    Logger.log('error: ' + e.message)
  }
}

function scheduleNewJob() {
  Logger.log('Scheduling one new job...')
  ScriptApp.newTrigger(TRIGGER_NAME)
    .timeBased()
    .at(new Date(new Date().getTime() + 1000 * 60 * RESUME_FREQUENCY))
    .create()
}

function deleteMailWithLoopMode() {
  var NOW = new Date()
  Logger.log('SEARCH: ' + SEARCH_STRING + ' PAGE_SIZE: ' + PAGE_SIZE)

  try {
    var threads = GmailApp.search(SEARCH_STRING, 0, PAGE_SIZE)

    if (threads.length == PAGE_SIZE) {
      scheduleNewJob()
    }

    Logger.log('Processing ' + threads.length + ' threads...')
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i]
      var lastMessageDate = thread.getLastMessageDate()

      if (lastMessageDate < NOW) {
        Logger.log('lastMessageDate ' + lastMessageDate)
        thread.moveToTrash()
      } else {
        var messages = GmailApp.getMessagesForThread(threads[i])
        for (var j = 0; j < messages.length; j++) {
          var email = messages[j]
          if (email.getDate() < age) {
            Logger.log('Start to move this mail to trash.')
            email.moveToTrash()
            Logger.log('Mail has been moved to trash.')
          }
        }
      }
    }
  } catch (e) {
    Logger.log('error: ' + e.message)
    scheduleNewJob()
  }
}
```
