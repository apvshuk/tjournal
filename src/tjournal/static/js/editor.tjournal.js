/*
    I have used 'editor.tjournal.js' as a name for this file, to avoid
    confusion between editorjs library and our custom file to validate
    the library on our app level
*/

let editorMarkup = '';

function loadEditor(success_func) {
    if (editorMarkup != '') { success_func(); return; }

    $.ajax({
        method: 'POST',
        url: '/editor-as-string/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        },
        success: (data) => {
            editorMarkup = data.template_as_string;
            success_func();
        },
        error: () => {
            $('.editorControl').html(`
                <div class="py-3" style="display: flex;align-items:center;justify-content:center;">
                    <button class="transp-btn bg-white btn-bx-s" id="editor_load_retry">Retry</button>
                </div>
            `);
        },
        beforeSend: () => {
            $('.editorControl').html(`
                <div class="py-3" style="display: flex;align-items:center;justify-content:center;">
                    <span class="spinner-border d-block mt-5 spinner-border-sm" role="status" aria-hidden="true" style="width: 5rem; height: 5rem;"></span>
                </div>
            `);
        },
    });
}

$(document).on('click', '.newEntryToggle,#editor_load_retry', (e) => {
    loadEditor(() => {
        $('.editorControl').html(editorMarkup);
    });
});

$(document).on('click', '.edit_post', (e) => {
    loadEditor(() => {
        $('.editorControl').html(`
            <div class="px-3 py-2 d-flex space-between bg-light">
                <div></div>
                <div class="my-auto">
                    <button class="my-auto transp-btn btn-bx-s mx-1 bg-white" id="publish_editor">Save</button>
                </div>
            </div>
        `);
    });
});