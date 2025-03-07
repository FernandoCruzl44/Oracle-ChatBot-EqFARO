package com.springboot.MyTodoList.controller;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardRemove;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.ToDoItemService;

public class ToDoItemBotController extends TelegramLongPollingBot {

  // Was in utils/BotHelper.java, could be moved back if it obstructs
  public void sendMessageToTelegram(Long chatId, String text) {

    try {
      // prepare message
      SendMessage messageToTelegram = new SendMessage();
      messageToTelegram.setChatId(chatId);
      messageToTelegram.setText(text);

      // hide keyboard
      ReplyKeyboardRemove keyboardMarkup = new ReplyKeyboardRemove(true);
      messageToTelegram.setReplyMarkup(keyboardMarkup);

      // send message
      this.execute(messageToTelegram);

    } catch (Exception e) {
      logger.error(e.getLocalizedMessage(), e);
    }
  }
	
	private static final String MAIN_SCREEN_MESSAGE = "Show Main Screen";
	private static final String LIST_ITEMS_MESSAGE = "List All Items";
	private static final String HIDE_MAIN_MESSAGE = "Hide Main Screen";
	private static final String ADD_ITEM_MESSAGE = "Add New Item";
	private static final String MY_TODO_MESSAGE = "MY TODO LIST";

	private static final Logger logger = LoggerFactory.getLogger(ToDoItemBotController.class);
	private ToDoItemService toDoItemService;
	private String botName;

	public ToDoItemBotController(String botToken, String botName, ToDoItemService toDoItemService) {
		super(botToken);
		logger.info("Bot Token: " + botToken);
		logger.info("Bot name: " + botName);
		this.toDoItemService = toDoItemService;
		this.botName = botName;
	}

	@Override
	public void onUpdateReceived(Update update) {

		if (update.hasMessage() && update.getMessage().hasText()) {

			String messageTextFromTelegram = update.getMessage().getText();
			long chatId = update.getMessage().getChatId();

			if (messageTextFromTelegram.equals("/start")
					|| messageTextFromTelegram.equals(MAIN_SCREEN_MESSAGE)) {

				SendMessage messageToTelegram = new SendMessage();
				messageToTelegram.setChatId(chatId);
				messageToTelegram.setText("Hello! I'm MyTodoList Bot!\nType a new todo item below and press the send button (blue arrow), or select an option below:");

				ReplyKeyboardMarkup keyboardMarkup = new ReplyKeyboardMarkup();
				List<KeyboardRow> keyboard = new ArrayList<>();

				// first row
				KeyboardRow row = new KeyboardRow();
				row.add(LIST_ITEMS_MESSAGE);
				row.add(ADD_ITEM_MESSAGE);
				// Add the first row to the keyboard
				keyboard.add(row);

				// second row
				row = new KeyboardRow();
				row.add(MAIN_SCREEN_MESSAGE);
				row.add(HIDE_MAIN_MESSAGE);
				keyboard.add(row);

				// Set the keyboard
				keyboardMarkup.setKeyboard(keyboard);

				// Add the keyboard markup
				messageToTelegram.setReplyMarkup(keyboardMarkup);

				try {
					execute(messageToTelegram);
				} catch (TelegramApiException e) {
					logger.error(e.getLocalizedMessage(), e);
				}

				// If done is found...
			} else if (messageTextFromTelegram.indexOf("DONE") != -1) {

				String done = messageTextFromTelegram.substring(0,
						messageTextFromTelegram.indexOf("-"));
				Integer id = Integer.valueOf(done);

				try {

					ToDoItem item = getToDoItemById(id).getBody();
					item.setDone(true);
					updateToDoItem(item, id);
					sendMessageToTelegram(chatId, "Item done! Select /todolist to return to the list of todo items, or /start to go to the main screen.");

				} catch (Exception e) {
					logger.error(e.getLocalizedMessage(), e);
				}

				// If "UNDO" is found
			} else if (messageTextFromTelegram.indexOf("UNDO") != -1) {

				String undo = messageTextFromTelegram.substring(0,
						messageTextFromTelegram.indexOf("-"));
				Integer id = Integer.valueOf(undo);

				try {

					ToDoItem item = getToDoItemById(id).getBody();
					item.setDone(false);
					updateToDoItem(item, id);
					sendMessageToTelegram(chatId, "Item undone! Select /todolist to return to the list of todo items, or /start to go to the main screen.");

				} catch (Exception e) {
					logger.error(e.getLocalizedMessage(), e);
				}

			} else if (messageTextFromTelegram.indexOf("DELETE") != -1) {

				String delete = messageTextFromTelegram.substring(0,
						messageTextFromTelegram.indexOf("-"));
				Integer id = Integer.valueOf(delete);

				try {

					deleteToDoItem(id).getBody();
					sendMessageToTelegram(chatId, "Item deleted! Select /todolist to return to the list of todo items, or /start to go to the main screen.");

				} catch (Exception e) {
					logger.error(e.getLocalizedMessage(), e);
				}

			} else if (messageTextFromTelegram.equals("/hide")
					|| messageTextFromTelegram.equals(HIDE_MAIN_MESSAGE)) {

				sendMessageToTelegram(chatId, "Bye! Select /start to resume!");

			} else if (messageTextFromTelegram.equals("/todolist")
					|| messageTextFromTelegram.equals(LIST_ITEMS_MESSAGE)
					|| messageTextFromTelegram.equals(MY_TODO_MESSAGE)) {

				List<ToDoItem> allItems = getAllToDoItems();
				ReplyKeyboardMarkup keyboardMarkup = new ReplyKeyboardMarkup();
				List<KeyboardRow> keyboard = new ArrayList<>();

				// command back to main screen
				KeyboardRow mainScreenRowTop = new KeyboardRow();
				mainScreenRowTop.add(MAIN_SCREEN_MESSAGE);
				keyboard.add(mainScreenRowTop);

				KeyboardRow firstRow = new KeyboardRow();
				firstRow.add(ADD_ITEM_MESSAGE);
				keyboard.add(firstRow);

				KeyboardRow myTodoListTitleRow = new KeyboardRow();
				myTodoListTitleRow.add(MY_TODO_MESSAGE);
				keyboard.add(myTodoListTitleRow);

				List<ToDoItem> activeItems = allItems.stream().filter(item -> item.isDone() == false)
						.collect(Collectors.toList());

				for (ToDoItem item : activeItems) {

					KeyboardRow currentRow = new KeyboardRow();
					currentRow.add(item.getDescription());
					currentRow.add(item.getID() + "-" + "DONE");
					keyboard.add(currentRow);
				}

				List<ToDoItem> doneItems = allItems.stream().filter(item -> item.isDone() == true)
						.collect(Collectors.toList());

				for (ToDoItem item : doneItems) {
					KeyboardRow currentRow = new KeyboardRow();
					currentRow.add(item.getDescription());
					currentRow.add(item.getID() + "-" + "UNDO");
					currentRow.add(item.getID() + "-" + "DELETE");
					keyboard.add(currentRow);
				}

				// command back to main screen
				KeyboardRow mainScreenRowBottom = new KeyboardRow();
				mainScreenRowBottom.add(MAIN_SCREEN_MESSAGE);
				keyboard.add(mainScreenRowBottom);

				keyboardMarkup.setKeyboard(keyboard);

				SendMessage messageToTelegram = new SendMessage();
				messageToTelegram.setChatId(chatId);
				messageToTelegram.setText(MY_TODO_MESSAGE);
				messageToTelegram.setReplyMarkup(keyboardMarkup);

				try {
					execute(messageToTelegram);
				} catch (TelegramApiException e) {
					logger.error(e.getLocalizedMessage(), e);
				}

			} else if (messageTextFromTelegram.equals("/additem")
					|| messageTextFromTelegram.equals(ADD_ITEM_MESSAGE)) {
				try {
					SendMessage messageToTelegram = new SendMessage();
					messageToTelegram.setChatId(chatId);
					messageToTelegram.setText("Type a new todo item below and press the send button (blue arrow) on the rigth-hand side.");
					// hide keyboard
					ReplyKeyboardRemove keyboardMarkup = new ReplyKeyboardRemove(true);
					messageToTelegram.setReplyMarkup(keyboardMarkup);

					// send message
					execute(messageToTelegram);

				} catch (Exception e) {
					logger.error(e.getLocalizedMessage(), e);
				}

			}

			else {
				try {
					ToDoItem newItem = new ToDoItem();
					newItem.setDescription(messageTextFromTelegram);
					newItem.setCreation_ts(OffsetDateTime.now());
					newItem.setDone(false);
					ResponseEntity entity = addToDoItem(newItem);

					SendMessage messageToTelegram = new SendMessage();
					messageToTelegram.setChatId(chatId);
					messageToTelegram.setText("New item added! Select /todolist to return to the list of todo items, or /start to go to the main screen.");

					execute(messageToTelegram);
				} catch (Exception e) {
					logger.error(e.getLocalizedMessage(), e);
				}
			}
		}
	}

	@Override
	public String getBotUsername() {		
		return botName;
	}

	// GET /todolist
	public List<ToDoItem> getAllToDoItems() { 
		return toDoItemService.findAll();
	}

	// GET BY ID /todolist/{id}
	public ResponseEntity<ToDoItem> getToDoItemById(@PathVariable int id) {
		try {
			ResponseEntity<ToDoItem> responseEntity = toDoItemService.getItemById(id);
			return new ResponseEntity<ToDoItem>(responseEntity.getBody(), HttpStatus.OK);
		} catch (Exception e) {
			logger.error(e.getLocalizedMessage(), e);
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}

	// PUT /todolist
	public ResponseEntity addToDoItem(@RequestBody ToDoItem todoItem) throws Exception {
		ToDoItem td = toDoItemService.addToDoItem(todoItem);
		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.set("location", "" + td.getID());
		responseHeaders.set("Access-Control-Expose-Headers", "location");
		// URI location = URI.create(""+td.getID())

		return ResponseEntity.ok().headers(responseHeaders).build();
	}

	// UPDATE /todolist/{id}
	public ResponseEntity updateToDoItem(@RequestBody ToDoItem toDoItem, @PathVariable int id) {
		try {
			ToDoItem toDoItem1 = toDoItemService.updateToDoItem(id, toDoItem);
			System.out.println(toDoItem1.toString());
			return new ResponseEntity<>(toDoItem1, HttpStatus.OK);
		} catch (Exception e) {
			logger.error(e.getLocalizedMessage(), e);
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
	}

	// DELETE todolist/{id}
	public ResponseEntity<Boolean> deleteToDoItem(@PathVariable("id") int id) {
		Boolean flag = false;
		try {
			flag = toDoItemService.deleteToDoItem(id);
			return new ResponseEntity<>(flag, HttpStatus.OK);
		} catch (Exception e) {
			logger.error(e.getLocalizedMessage(), e);
			return new ResponseEntity<>(flag, HttpStatus.NOT_FOUND);
		}
	}

}
