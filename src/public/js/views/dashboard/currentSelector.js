class currentSelectorCellEditor {
  init(params) {
    // create the cell
    // <input id="TypeaheadBloodHound" class="form-control typeahead-bloodhound" type="text" autocomplete="off" placeholder="Enter states from USA" />
    this.eInput = document.createElement('input');
    this.eInput.id = 'current-name';
    this.eInput.className = 'form-control typeahead-bloodhound';
    this.eInput.type = 'text';
    this.eInput.autocomplete = 'off';
    this.eInput.placeholder = 'Cari seçiniz';
    this.eInput.width = '100%';
    this.eInput.value = params.data.logo_current_name;
    setTimeout(() => {
      $('#current-name')
        .typeahead(null, {
          name: 'current-name',
          display: 'name',
          source: new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote: {
              url: '/search-currents?q=%QUERY',
              wildcard: '%QUERY',
              rateLimitWait: 750,
            },
          }),
          highlight: true,
          templates: {
            pending: (q) => {
              return `<div class="loader-block d-flex justify-content-center">
                            <div class="sk-wave sk-primary">
                                <div class="sk-wave-rect"></div>
                                <div class="sk-wave-rect"></div>
                                <div class="sk-wave-rect"></div>
                                <div class="sk-wave-rect"></div>
                                <div class="sk-wave-rect"></div>
                            </div>
                        </div>`;
            },
            notFound: () => {
              return ``;
            },
            suggestion: function (data) {
              return '<div><strong>' + data.name + '</strong> – ' + data.code + '</div>';
            },
          },
        })
        .bind('typeahead:select typeahead:autocomplete', function (ev, suggestion) {
          params.node.setDataValue('logo_current_id', suggestion.id);
          params.node.setDataValue('logo_current_name', suggestion.name);
          $.ajax({
            url: `/update-invoice-current/${params.node.data.id}`,
            type: 'PUT',
            data: {
              logoCurrentId: suggestion.id,
              logoCurrentName: suggestion.name,
            },
            success: function (result) {
              params.node.setDataValue('status', result.status);
            },
          });
          params.stopEditing();
        })
        .bind('typeahead:change', function (ev, suggestion) {
          if (suggestion === '') {
            params.node.setDataValue('logo_current_id', null);
            params.node.setDataValue('logo_current_name', null);
            $.ajax({
              url: `/update-invoice-current/${params.node.data.id}`,
              type: 'PUT',
              data: {
                logoCurrentId: null,
                logoCurrentName: null,
              },
              success: function (result) {
                params.node.setDataValue('status', result.status);
              },
            });
            params.stopEditing();
          }
        });
      $('#current-name').focus();
    }, 100);
  }

  // gets called once when grid ready to insert the element
  getGui() {
    return this.eInput;
  }

  // focus and select can be done after the gui is attached
  afterGuiAttached() {
    this.eInput.focus();
  }

  // returns the new value after editing
  getValue() {
    return this.eInput.value;
  }

  // any cleanup we need to be done here
  destroy() {
    $('#current-name').typeahead('destroy');
  }
}
