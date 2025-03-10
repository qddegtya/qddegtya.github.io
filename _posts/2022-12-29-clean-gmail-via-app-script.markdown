---
layout: single
title: How to clean email for gmail via app script ?
tags: google gmail
category: tool
excerpt: "分享一枚非常实用的 google app script"
---

分享一枚非常实用的 **google app script**，需要的同学可以将其安装于 **https://script.google.com/**；
它支持全自动调度清理任务，清理任务主要根据 **gmail** 中的指定搜索条件。

### Feature

- 指定 `gmail` 搜索条件
- 错误 / 边界条件等自动触发新调度
- trigger 唯一

### Content of App Script

{% highlight javascript linenos mark_lines="1 2" %}
//search string to delete
var SEARCH_STRING = "category:forums";

//tigger function name
var TRIGGER_NAME = "cleanWithScheduler";

//first time job delay (min)
var FIRST_TIME_DELAY_MIN = 1;

// FREQUENCY of scheduler (min)
var RESUME_FREQUENCY = 10;

//batch size
var BATCH_SIZE = 500;

//intialize
function intialize() {
  return;
}

//install
function install() {
  ScriptApp.newTrigger(TRIGGER_NAME)
    .timeBased()
    .at(new Date(new Date().getTime() + 1000 * 60 * FIRST_TIME_DELAY_MIN))
    .create();
}

//clean triggers
function cleanTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

//clean immediately
function cleanImmediately() {
  var NOW = new Date();
  Logger.log("SEARCH: " + SEARCH_STRING + " BATCH_SIZE: " + BATCH_SIZE);

  try {
    var threads = GmailApp.search(SEARCH_STRING, 0, BATCH_SIZE);

    Logger.log("Processing " + threads.length + " threads...");
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];
      var lastMessageDate = thread.getLastMessageDate();

      if (lastMessageDate < NOW) {
        Logger.log("lastMessageDate " + lastMessageDate);
        thread.moveToTrash();
      } else {
        var messages = GmailApp.getMessagesForThread(threads[i]);
        for (var j = 0; j < messages.length; j++) {
          var email = messages[j];
          if (email.getDate() < NOW) {
            Logger.log("Start to move this mail to trash.");
            email.moveToTrash();
            Logger.log("Mail has been moved to trash.");
          }
        }
      }
    }
  } catch (e) {
    Logger.log("error: " + e.message);
  }
}

//schedule new job
function scheduleNewJob() {
  //before new job, we clear all triggers first
  Logger.log("clean triggers...");
  cleanTriggers();

  Logger.log("Scheduling one new job...");
  ScriptApp.newTrigger(TRIGGER_NAME)
    .timeBased()
    .at(new Date(new Date().getTime() + 1000 * 60 * RESUME_FREQUENCY))
    .create();
}

//clean with scheduler
function cleanWithScheduler() {
  var NOW = new Date();
  Logger.log("SEARCH: " + SEARCH_STRING + " BATCH_SIZE: " + BATCH_SIZE);

  try {
    var threads = GmailApp.search(SEARCH_STRING, 0, BATCH_SIZE);

    if (threads.length == BATCH_SIZE) {
      scheduleNewJob();
    }

    Logger.log("Processing " + threads.length + " threads...");
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];
      var lastMessageDate = thread.getLastMessageDate();

      if (lastMessageDate < NOW) {
        Logger.log("lastMessageDate " + lastMessageDate);
        thread.moveToTrash();
      } else {
        var messages = GmailApp.getMessagesForThread(threads[i]);
        for (var j = 0; j < messages.length; j++) {
          var email = messages[j];
          if (email.getDate() < NOW) {
            Logger.log("Start to move this mail to trash.");
            email.moveToTrash();
            Logger.log("Mail has been moved to trash.");
          }
        }
      }
    }
  } catch (e) {
    Logger.log("error: " + e.message);
    scheduleNewJob();
  }
}
{% endhighlight %}
