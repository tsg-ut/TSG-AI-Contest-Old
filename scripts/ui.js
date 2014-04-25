Game.prototype.enableShortcutKeys = function () {
    shortcut.add('ctrl+5', function () {
        $("#executeButton").click();
        return true;
    });
};

Game.prototype.enableButtons = function () {
    var game = this;

    $("#executeButton").click( function () {
        game.sound.playSound('blip');
        game._evalLevelCode();
    });
};

Game.prototype.setUpNotepad = function () {
    var game = this;

    var textarea = document.getElementById('notepadTextarea');
    this.notepadEditor = CodeMirror.fromTextArea(textarea, {
        theme: 'vibrant-ink',
        lineNumbers: true,
        mode: 'javascript'
    });

    this.notepadEditor.setSize(null, 275);

    var ls_tag = 'notepadContent';
    var content = localStorage.getItem(ls_tag);
    if (content === null) {
        content = '';
    }
    this.notepadEditor.setValue(content);

    $('#notepadPaneCloseButton').click(function () {
        $('#notepadPane').hide();
    });

    $('#notepadSaveButton').click(function () {
        var v = game.notepadEditor.getValue();
        localStorage.setItem(ls_tag, v);
    });
};

Game.prototype.openMenu = function () {
    var game = this;

    $('#menuPane #levels').html('');
    $.each(game._levelFileNames, function (levelNum, fileName) {
        levelNum += 1;
        var levelName = fileName.split('.')[0];
        levelName = levelName.split('_').join(' ');

        var levelButton = $('<button>');
        if (levelNum <= game._levelReached) {
            levelButton.text(levelName).click(function () {
                game._jumpToNthLevel(levelNum);
                $('#menuPane').hide();
            });
        } else {
            levelButton.text('???').addClass('disabled');
        }
        levelButton.appendTo('#menuPane #levels');
    });

    $('#helpPane, #notepadPane').hide();
    $('#menuPane').toggle();
};

Game.prototype.activateSuperMenu = function () {
    var game = this;

    if (!game._superMenuActivated) {
        $('#menuPane').addClass('expanded');
        $('#leftMenuPane').show();
        $('#rightMenuPane .pop_up_box_heading').hide();

        $('#rootDir').click(function () {
            $('#leftMenuPane li').removeClass('selected');
            $('#rightMenuPane div').hide();
            $('#rootDir').addClass('selected');
            $('#root').show();
        });

        $('#levelsDir').click(function () {
            $('#leftMenuPane li').removeClass('selected');
            $('#rightMenuPane div').hide();
            $('#levelsDir').addClass('selected');
            $('#levels').show();
        });

        $('#scriptsDir').click(function () {
            $('#leftMenuPane li').removeClass('selected');
            $('#rightMenuPane div').hide();
            $('#scriptsDir').addClass('selected');
            $('#scripts').show();
        });

        $.each(game._viewableScripts, function (i, script) {
            var scriptButton = $('<button>');
            scriptButton.text(script).click(function () {
                game._editFile('scripts/' + script);
                $('#menuPane').hide();
            });

            if (game._editableScripts.indexOf(script) == -1) {
                scriptButton.addClass('uneditable');
            }

            scriptButton.appendTo('#menuPane #scripts');
        });

        game._superMenuActivated = true;
    }
}

Game.prototype.openHelp = function () {
    var game = this;

    var categories = [];

    $('#helpPaneSidebar ul').html('');
    $('#helpPaneContent').html('');

    // build help
    $.each(game._getHelpCommands(), function (i, command) {
        if (game.reference[command]) {
            var reference = game.reference[command];

            if (categories.indexOf(reference.category) == -1) {
                categories.push(reference.category);

                var categoryLink = $('<li class="category" id="'+ reference.category +'">');
                categoryLink.text(reference.category)
                    .click(function () {
                        $('#helpPaneSidebar .category').removeClass('selected');
                        $(this).addClass('selected');

                        $('#helpPaneContent .category').hide();
                        $('#helpPaneContent .category#' + this.id).show();
                });
                $('#helpPaneSidebar ul').append(categoryLink);

                $('#helpPaneContent').append($('<div class="category" id="'+ reference.category +'">'));
            }

            var $command = $('<div class="command">');
            $command.appendTo($('#helpPaneContent .category#' + reference.category));

            var $commandTitle = $('<div class="commandTitle">');
            $commandTitle.text(reference.name)
                .appendTo($command);

            var $commandDescription = $('<div class="commandDescription">');
            $commandDescription.html(reference.description)
                .appendTo($command);
        }
    });

    // sort help commands
    $('#helpPaneContent .category').each(function (i, category) {
        $(category).find('.command').sortElements(function (a, b) {
            var contentA = $(a).find('.commandTitle').text();
            var contentB = $(b).find('.commandTitle').text();
            return (contentA < contentB) ? -1 : (contentA > contentB) ? 1 : 0;
        });
    });

    if (!$('#helpPane').is(':visible')) {
        $('#menuPane, #notepadPane').hide();
        $('#helpPane').show();
        $('#helpPaneSidebar .category#global').click();
    } else {
        $('#helpPane').hide();
    }
};
