const columnDefs = [
  {
    headerName: '',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    headerClass: 'checkbox',
    pinned: 'left',
    width: 48,
    field: 'checkboxBtn',
    resizable: false,
    lockPosition: 'left',
    suppressAutoSize: true,
    suppressColumnsToolPanel: true,
    suppressMenu: true,
    editable: false,
  },
  {
    field: 'master',
    cellRenderer: 'agGroupCellRenderer',
    editable: false,
    width: 48,
  },
  {
    field: 'status',
    headerName: 'Aktarım Durumu',
    filter: 'agSetColumnFilter',
    cellStyle: { textAlign: 'center' },
    filterParams: {
      valueFormatter: function (params) {
        if (params.value === 100) {
          return 'İşlem Gerekiyor!';
        } else if (params.value === 101) {
          return 'Aktarılabilir';
        } else if (params.value === 200) {
          return 'Başarılı Aktarım';
        } else if (params.value === 400) {
          return 'Hatalı Aktarım';
        } else {
          return params.value;
        }
      },
    },
    editable: false,
    cellRenderer: function (params) {
      if (params.value === 100) {
        return `<span class="badge badge-center rounded-pill bg-instagram"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i></span>`;
      } else if (params.value === 101) {
        return '<span class="badge badge-center rounded-pill bg-warning"><i class="ti ti-circle"></i></span>';
      } else if (params.value === 200) {
        return '<span class="badge badge-center rounded-pill bg-success"><i class="ti ti-check"></i></span>';
      } else if (params.value === 400) {
        return '<span class="badge badge-center rounded-pill bg-danger"><i class="fa-solid fa-xmark"></i></span>';
      } else {
        return params.value;
      }
    },
    width: 60,
  },
  {
    field: 'id',
    hide: true,
    suppressColumnsToolPanel: true,
  },
  {
    field: 'uuid',
    headerName: 'UUID',
    filter: 'agTextColumnFilter',
    hide: true,
  },
  {
    field: 'number',
    headerName: 'Fatura No',
    filter: 'agTextColumnFilter',
    width: 180,
    editable: false,
  },
  {
    field: 'direction',
    headerName: 'Yön',
    filter: 'agSetColumnFilter',
    filterParams: {
      valueFormatter: function (params) {
        if (params.value === 2) {
          return 'Gelen';
        } else if (params.value === 1) {
          return 'Giden';
        } else {
          return params.value;
        }
      },
    },
    valueFormatter: function (params) {
      if (params.value === 2) {
        return 'Gelen';
      } else if (params.value === 1) {
        return 'Giden';
      } else {
        return params.value;
      }
    },
  },
  {
    field: 'profile_id',
    headerName: 'Fatura Profili',
    filter: 'agSetColumnFilter',
    width: 150,
  },
  {
    field: 'type_code',
    headerName: 'Tip',
    filter: 'agSetColumnFilter',
    width: 100,
  },
  {
    field: 'issue_datetime',
    headerName: 'Tarih',
    width: 130,
    valueFormatter: function (params) {
      return moment.utc(params.value).format('DD/MM/YYYY');
    },
  },
  {
    field: 'logo_current_id',
    headerName: 'Logo ID',
    filter: 'agTextColumnFilter',
    width: 130,
    hide: true,
  },
  {
    field: 'logo_current_name',
    headerName: 'Logo Ünvan',
    filter: 'agTextColumnFilter',
    width: 200,
    editable: true,
    cellEditor: currentSelectorCellEditor,
    cellEditorPopup: true,
    cellStyle: (params) =>
      !!params.data.logo_current_id ? { backgroundColor: 'transparent' } : { backgroundColor: '#ea5455' },
  },
  {
    field: 'company_tax',
    headerName: 'Karşı VKTCKN',
    filter: 'agTextColumnFilter',
    width: 130,
  },
  {
    field: 'company_name',
    headerName: 'Karşı Ünvan',
    filter: 'agTextColumnFilter',
    width: 200,
  },
  {
    field: 'payable_amount',
    headerName: 'Tutar',
    filter: 'agNumberColumnFilter',
    width: 150,
    valueFormatter: function (params) {
      return Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: params.data.currency_code,
      }).format(params.value);
    },
  },
  {
    field: 'logo_invoice_send_detail',
    headerName: 'Logo Fatura Aktarım Detayı',
    filter: 'agTextColumnFilter',
    readOnly: true,
    editable: false,
    width: 200,
    cellStyle: (params) =>
      params.data.status === 200 || params.data.status === 400
        ? params.data.logo_invoice_id && params.data.logo_invoice_send_status
          ? { backgroundColor: '#28c76f' }
          : { backgroundColor: '#ea5455' }
        : { backgroundColor: 'transparent' },
    valueFormatter: function (params) {
      return params.data.status === 200 || params.data.status === 400
        ? params.data.logo_invoice_id && params.data.logo_invoice_send_status
          ? 'Aktarıldı. Fatura ID : ' + params.data.logo_invoice_id
          : 'Aktarılamadı. Hata : ' + params.data.logo_invoice_send_detail
        : 'Aktarılmadı.';
    },
  },
];

const masterColumnDefs = [
  {
    headerName: '',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    headerClass: 'checkbox',
    pinned: 'left',
    width: 48,
    field: 'checkboxBtn',
    resizable: false,
    lockPosition: 'left',
    suppressAutoSize: true,
    suppressColumnsToolPanel: true,
    suppressMenu: true,
    editable: false,
  },
  {
    field: 'id',
    hide: true,
    suppressColumnsToolPanel: true,
  },
  {
    field: 'logo_item_id',
    headerName: 'Logo Kalem ID',
    filter: 'agTextColumnFilter',
    width: 130,
    hide: true,
  },
  {
    field: 'logo_item_name',
    headerName: 'Logo Kalem Adı',
    filter: 'agTextColumnFilter',
    width: 400,
    editable: true,
    cellEditor: itemSelectorCellEditor,
    cellEditorPopup: true,
    cellStyle: (params) =>
      !!params.data.logo_item_id ? { backgroundColor: 'transparent' } : { backgroundColor: '#ea5455' },
  },
  {
    field: 'name',
    headerName: 'Kalem Adı',
    filter: 'agTextColumnFilter',
    width: 400,
  },
  {
    field: 'quantity',
    headerName: 'Miktar',
    filter: 'agNumberColumnFilter',
  },
  {
    field: 'quantity_unit',
    headerName: 'Birim',
    filter: 'agTextColumnFilter',
  },
  {
    field: 'price',
    headerName: 'Birim Fiyat',
    filter: 'agNumberColumnFilter',
  },
  {
    field: 'amount',
    headerName: 'Tutar',
    filter: 'agNumberColumnFilter',
  },
];

const localeText = AG_GRID_LOCALE_TR;

const gridOptions = {
  defaultColDef: {
    resizable: true,
    width: 120,
    floatingFilter: true,
  },
  sideBar: {
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        toolPanelParams: {
          suppressRowGroups: true,
          suppressValues: true,
          suppressPivots: true,
          suppressPivotMode: true,
        },
      },
      'filters',
    ],
  },
  columnDefs: columnDefs,
  rowData: [],
  rowDragManaged: true,
  animateRows: true,
  localeText: localeText,
  rowSelection: 'multiple',
  rowMultiSelectWithClick: true,
  // readOnlyEdit: true,
  singleClickEdit: true,
  stopEditingWhenCellsLoseFocus: true,
  masterDetail: true,
  detailCellRendererParams: {
    detailGridOptions: {
      defaultColDef: {
        resizable: true,
        width: 120,
        floatingFilter: true,
      },
      sideBar: {
        toolPanels: [
          {
            id: 'columns',
            labelDefault: 'Columns',
            labelKey: 'columns',
            iconKey: 'columns',
            toolPanel: 'agColumnsToolPanel',
            toolPanelParams: {
              suppressRowGroups: true,
              suppressValues: true,
              suppressPivots: true,
              suppressPivotMode: true,
            },
          },
        ],
      },
      columnDefs: masterColumnDefs,
      localeText: localeText,
      rowDragManaged: true,
      animateRows: true,
      rowSelection: 'multiple',
      singleClickEdit: true,
      stopEditingWhenCellsLoseFocus: true,
    },
    getDetailRowData: (params) => {
      params.successCallback(params.data.lines);
    },
  },
  getRowHeight: (params) => {
    const isDetailRow = params.node.detail;
    if (!isDetailRow) return undefined;
    const detailPanelHeight = params.data.lines.length * 80;
    return detailPanelHeight > 500 ? detailPanelHeight : 500;
  },
};

$(document).ready(function () {
  var gridDiv = document.querySelector('#invoices-grid');
  gridApi = agGrid.createGrid(gridDiv, gridOptions);

  setTimeout(function () {
    const filter = {
      status: {
        values: ['100', '101'],
        filterType: 'set',
      },
      direction: {
        values: ['1'],
        filterType: 'set',
      },
    };
    gridApi.setFilterModel(filter);
  }, 500);
  const getInvoices = () => {
    let sd_data = moment.utc(start_date.selectedDates[0]);
    let ed_data = moment.utc(end_date.selectedDates[0]);
    $.ajax({
      url: `/list-invoices`,
      data: {
        startDate: sd_data.format('YYYY-MM-DD HH:mm:ss'),
        endDate: ed_data.format('YYYY-MM-DD HH:mm:ss'),
      },
      type: 'GET',
      dataType: 'json',
      success: function (data) {
        gridApi.setRowData(data);
      },
    });
  };

  getInvoices();

  const searchTable = () => {
    gridApi.showLoadingOverlay();
    getInvoices();
    gridApi.hideOverlay();
  };

  $('#search-button').on('click', function () {
    searchTable();
  });

  $('#sync-invoices').on('click', function () {
    let sd_data = moment.utc(start_date.selectedDates[0]);
    let ed_data = moment.utc(end_date.selectedDates[0]).add(1, 'days');
    Swal.fire({
      html: `<b>${sd_data.format('DD.MM.YYYY')} - ${ed_data.format(
        'DD.MM.YYYY',
      )}</b> <br> tarihleri arası senkronize edilecek. Emin misiniz?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Evet, senkronize et!',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Hayır',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Faturalar senkronize ediliyor...',
          html: '<i class="fas fa-spinner fa-spin fa-3x"></i><br/><br><p>Lütfen bekleyiniz...</p>',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        });
        $.ajax({
          type: 'GET',
          url: '/sync-invoices',
          data: {
            startDate: sd_data.format('YYYY-MM-DD HH:mm:ss'),
            endDate: ed_data.format('YYYY-MM-DD HH:mm:ss'),
          },
          dataType: 'json',
          success: (result) => {
            console.log(result);
            searchTable();
            Swal.fire({
              title: 'Faturalar senkronize edildi!',
              text: result.message,
              icon: 'success',
            });
          },
          error: (error) => {
            console.log(error);
            Swal.fire({
              title: 'Faturalar senkronize edilemedi!',
              text: JSON.stringify(error.responseJSON),
              icon: 'error',
            });
          },
        });
      }
    });
  });

  $('#send-selected-invoices').on('click', function () {
    const selectedNodes = gridApi.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data.id);
    console.log(selectedData);
    Swal.fire({
      html: `<b>${selectedData.length}</b> adet fatura Logo'ya aktarılacak. Emin misiniz?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Evet, gönder!',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Hayır',
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Faturalar Logo'ya aktarılıyor...",
          html: '<i class="fas fa-spinner fa-spin fa-3x"></i><br/><br><p>Lütfen bekleyiniz...</p>',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        });
        let requests = [];
        selectedData.forEach((element) => {
          requests.push({
            type: 'PUT',
            url: `/send-invoice-to-logo/${element}`,
            dataType: 'json',
          });
        });

        for (const request of requests) {
          try {
            await $.ajax(request);
          } catch (error) {
            console.log(error);
          }
        }
        searchTable();
        Swal.fire({
          title: 'Aktarıldı. Durumları kontrol ediniz!',
        });
      }
    });
  });
});
