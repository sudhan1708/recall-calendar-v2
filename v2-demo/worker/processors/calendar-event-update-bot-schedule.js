import Recall from "../../services/recall/index.js";
import db from "../../db.js";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your local file
const filePath = join(__dirname, '../convozen_logo.jpeg');

// Read the file and convert it to Base64
const getBase64FromFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64Data = data.toString('base64');
        resolve(base64Data);
      }
    });
  });
};


// add or remove bot for a calendar event based on its record status
export default async (job) => {
  const { recallEventId } = job.data;
  const event = await db.CalendarEvent.findOne({
    where: { recallId: recallEventId },
  });

  let updatedEventFromRecall = null;
  if (
    (event.shouldRecordAutomatic || event.shouldRecordManual) &&
    event.meetingUrl
  ) {
    console.log(`INFO: Schedule bot for event ${event.id}`);
    const base64Data = await getBase64FromFile(filePath);
    // add a bot to record the event. Recall will handle the case where the bot already exists.
    updatedEventFromRecall = await Recall.addBotToCalendarEvent({
      id: event.recallId,
      deduplicationKey: `${event.startTime.toISOString()}-${event.meetingUrl}`,
      botConfig: {
        "bot_name": "ConvoZen.ai",
        "metadata": {
          "organisation": "convozen"
        },
        "automatic_video_output": {
          "in_call_recording": {
              "kind": "jpeg",
              "b64_data": base64Data,
          }
      }
    }
    });
  } else {
    console.log(`INFO: Delete bot for event ${event.id}` );
    // delete the bot for the event. Recall will handle the case where the bot does not exist.
    updatedEventFromRecall = await Recall.removeBotFromCalendarEvent({
      id: event.recallId,
    });
  }

  // update event data returned from Recall
  if (updatedEventFromRecall) {
    event.recallData = updatedEventFromRecall;
    await event.save();
  }
};
