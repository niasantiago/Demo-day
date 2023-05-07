const button = document.querySelector('.fetch')
const background = document.querySelector(".modal-background"); 
const modalContainer = document.querySelector('#modal-container');

button.addEventListener('click', openModal)

function openModal(){
  const buttonId = this.getAttribute('id');
  const modalContainer = document.querySelector('#modal-container');
  modalContainer.removeAttribute('class');
  modalContainer.classList.add(buttonId);
  document.body.classList.add('modal-active');
}

modalContainer.addEventListener('click', function(e) {
  const clickedBackground = e.target == background;
  if (clickedBackground) {
    this.classList.add('out');
    document.body.classList.remove('modal-active');
  }
});