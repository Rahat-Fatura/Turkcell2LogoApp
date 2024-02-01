class itemSelectorCellEditor {
  init(params) {
    // create the cell
    // <input id="TypeaheadBloodHound" class="form-control typeahead-bloodhound" type="text" autocomplete="off" placeholder="Enter states from USA" />
    this.eInput = document.createElement('input');
    this.eInput.id = 'item-name';
    this.eInput.className = 'form-control typeahead-bloodhound w-auto';
    this.eInput.type = 'text';
    this.eInput.autocomplete = 'off';
    this.eInput.placeholder = 'Ürün seçiniz';
    this.eInput.value = params.data.logo_item_name;
    setTimeout(() => {
      $('#item-name')
        .typeahead(null, {
          name: 'item-name',
          display: 'name',
          source: new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote: {
              url: '/search-items?q=%QUERY',
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
          params.node.setDataValue('logo_item_id', suggestion.id);
          params.node.setDataValue('logo_item_name', suggestion.name);
          $.ajax({
            url: `/update-line-item/${params.node.data.id}`,
            type: 'PUT',
            data: {
              logoItemId: suggestion.id,
              logoItemName: suggestion.name,
            },
            success: function (result) {
              // params.node.setDataValue('status', result.status);
            },
          });
          params.stopEditing();
        })
        .bind('typeahead:change', function (ev, suggestion) {
          if (suggestion === '') {
            params.node.setDataValue('logo_item_id', null);
            params.node.setDataValue('logo_item_name', null);
            $.ajax({
              url: `/update-line-item/${params.node.data.id}`,
              type: 'PUT',
              data: {
                logoItemId: null,
                logoItemName: null,
              },
              success: function (result) {
                // params.node.setDataValue('status', result.status);
              },
            });
            params.stopEditing();
          }
        });
      $('#item-name').focus();
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
    $('#item-name').typeahead('destroy');
  }
}
