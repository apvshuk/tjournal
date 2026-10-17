let currentEditor = null;
function saveEditor(editor, published = false, currentEditor = null) {
    function error__() {
        showAlert();
        $('#publish_editor,#save_editor').attr('disabled', false);
    }
    editor.save().then((dta) => {
        if (dta.blocks.length == 0) {
            showAlert('Please add some text');
            return;
        }
        // save to db
        let fd = new FormData();
        fd.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').val());
        fd.append('content', JSON.stringify(dta));
        fd.append('published', published);
        if (currentEditor != null) {
            fd.append('edit', currentEditor);
        }
        $.ajax({
            url: '/',
            method: 'POST',
            enctype: 'multipart/form-data',
            data: fd,
            success: (dt) => {
                $('#new_entry_modal').modal('hide');
                editor.blocks.clear();
                $('#publish_editor,#save_editor').attr('disabled', false);
                showAlert('Your post has been saved');
                loadPage(dt.url, false);
            },
            error: () => {
                error__();
            },
            beforeSend: () => {
                $('#publish_editor,#save_editor').attr('disabled', true);
            },
            cache: false,
            contentType: false,
            processData: false,
        });
    }).catch((error) => {
        console.error('Saving failed: ', error)
        error__();
    });
}

function initEditorJsField(field_id, config) {
    var pluginName = "django_editorjs_fields - " + field_id
    var pluginHelp =
        "Write about the issue here: https://github.com/2ik/django-editorjs-fields/issues"
    var textarea = document.getElementById(field_id)
    var holder = textarea.nextElementSibling
    var text = textarea.value.trim()

    if (text) {
        try {
            text = JSON.parse(text)
        } catch (error) {
            console.error(error)
            console.error(
                pluginName +
                " - invalid json data from the database. Clear the field manually. " +
                pluginHelp
            )
            holder.remove()
            return false
        }
    }

    textarea.style.display = "none" // remove old textarea

    var editorConfig = {
        id: field_id,
        holder: holder,
        data: text,
    }

    if ("tools" in config) {
        // set config
        var tools = config.tools

        for (var plugin in tools) {
            var cls = tools[plugin].class

            if (cls && window[cls] != undefined) {
                tools[plugin].class = eval(cls)
                continue
            }

            delete tools[plugin]
        }

        editorConfig.tools = tools
    }

    if ("autofocus" in config) {
        editorConfig.autofocus = !!config.autofocus
    }

    if ("hideToolbar" in config) {
        editorConfig.hideToolbar = !!config.hideToolbar
    }

    if ("inlineToolbar" in config) {
        editorConfig.inlineToolbar = config.inlineToolbar
    }

    if ("readOnly" in config) {
        editorConfig.readOnly = config.readOnly
    }

    if ("minHeight" in config) {
        editorConfig.minHeight = config.minHeight || 300
    }

    if ("logLevel" in config) {
        editorConfig.logLevel = config.logLevel || "VERBOSE"
    } else {
        editorConfig.logLevel = "ERROR"
    }

    if ("placeholder" in config) {
        editorConfig.placeholder = config.placeholder || "Type text..."
    } else {
        editorConfig.placeholder = "Type text..."
    }

    if ("defaultBlock" in config) {
        editorConfig.defaultBlock = config.defaultBlock || "paragraph"
    }

    if ("sanitizer" in config) {
        editorConfig.sanitizer = config.sanitizer || {
            p: true,
            b: true,
            a: true,
        }
    }

    if ("i18n" in config) {
        editorConfig.i18n = config.i18n || {}
    }

    editorConfig.onChange = function () {
        editor
            .save()
            .then(function (data) {
                textarea.value = JSON.stringify(data)
            })
            .catch(function (error) {
                console.log("save error: ", error)
            })
    }
    var editor = new EditorJS(editorConfig)

    $(document).on('click', '.newEntryToggle,#editor_load_retry', (e) => {
        editor.destroy();
        editorConfig.data = text;
        editor = new EditorJS(editorConfig);
        currentEditor = null;
    });

    $(document).on('click', '#publish_editor', (e) => {
        saveEditor(editor = editor, published = true, currentEditor = currentEditor);
    });

    $(document).on('click', '#save_editor', (e) => {
        saveEditor(editor = editor, currentEditor = currentEditor);
    });

    $(document).on('click', '.edit_post', (e) => {
        let pk = $(e.target).data('pk');
        $.ajax({
            method: 'POST',
            url: '/get-post-data/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                pk: pk,
            },
            success: (data) => {
                if (data.status) {
                    currentEditor = Number(pk);
                    editor.destroy();
                    editorConfig.data = data.content;
                    editor = new EditorJS(editorConfig);
                    $('#new_entry_modal').modal('show');
                }
            },
            error: () => {
                showAlert();
            },
            beforeSend: () => {
                hideAllDropdown();
            }
        });
    });
}