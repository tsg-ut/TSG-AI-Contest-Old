Game.prototype.enableShortcutKeys = function () {
    shortcut.add('ctrl+5', function () {
        $("#executeButton").click();
        return true;
    });
};

Game.prototype.enableButtons = function () {
    var game = this;

    $("#executeButton").click( function () {
        game._evalCode();
    });
};