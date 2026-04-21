const LayoutManager = {
  apply(state) {
    if (state.smartClean) document.body.classList.add('clean-ui');
    else document.body.classList.remove('clean-ui');

    if (state.compactView) document.body.classList.add('compact-view');
    else document.body.classList.remove('compact-view');
  }
};
