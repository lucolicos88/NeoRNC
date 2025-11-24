function onOpen(e) {
  try {
    PrintManager.createPrintMenu();
  } catch (error) {
    Logger.logError('ONOPEN_ERROR', error);
  }
}