
/* eslint no-unused-vars: ["error", { "vars": "local" }] */

function elc(className) {
  const els = document.getElementsByClassName(className);
  return Array.from(els);
}

// eslint-disable-next-line no-unused-vars
function elid(id) {
  const el = document.getElementById(id);
  return el;
}

// Typical styles for the main article or section of a page.
const mainStyle1 = "color1 color1-bg2 system-sans-serif fw1 f7 f6-m f5-l mw7 mt1 pa2 pa3-l center wwbw br3";
// Typical styles for first heading line.
const mainHeadingStyle1 = "color1-heading mt0 pt0 pt0-l fw1";
// Typical style for in page links (ie not the top of page navigation).
const linkStyle2 =
  "db link color1 color1-bg3 color1-hover mv2 ph1 pv1 pv2-l br2";
// Style for most images at top of page
const imageStyle1 = "w4 w5-l br2 mb2";
// Typical button styles.
const buttonStyle1 =
  "mt1 pa2 outline-0 db color1 color1-disabled color1-bg3 color1-hover color1-border br2";
// Same button style, but display 'inline block'.
const buttonStyle2 =
  "pa2 outline-0 dib color1 color1-disabled color1-bg3 color1-hover color1-border br2";

// Add style classes to elements.
// 'classToStyle', 'style1 style2 style3 ...'
function addStylesToElements(classToStyle, styleData) {
  // Get the elements that match the class to be styled.
  const elementsToStyle = elc(classToStyle);
  // Get the styles to be added to each element of class.
  // Split string may contain 'blank' lines, filter them out.
  const classList = styleData.split(" ").filter(style => style.length > 0);
  // Apply the styles to the elements (need ... spread operator).
  elementsToStyle.forEach(element => element.classList.add(...classList));
}

// Currently, Edge browser cannot handle custom elements, so
// fake it.
function createMyProfilePhoto(containerClass) {
  const elementsToStyle = elc(containerClass);
  elementsToStyle.forEach(
    element =>
      (element.innerHTML = `
    <img src="Images/profile-sept-2019.jpg" 
      alt="Steve in September 2019 (age 63 years, 3 months)" 
      title="Steve in September 2019 (age 63 years, 3 months)" 
      class="w4 br2">
    `)
  );
}

// Common header and navigation (intended for top of every page).
function createHeaderNav(containerClass) {
  const elementsToStyle = elc(containerClass);
  elementsToStyle.forEach(
    element =>
      (element.innerHTML = `
    <header>
    <a class="link times" href="index.html">
      <p class="mb0 color1-heading color1-bg2 color1-hover fw1 f5 f4-m f4-l ma0 pt1 pt2-m pt2-l pb1 pb2-m pb2-l pr1 pr2-m pr2-l pl3 pl3-m pl3-l br3 br--bottom">
        stephen mark turner
        <span class="f7 f6-m f6-l pl2">BASc, PTS</span>
      </p>
    </a>
    </header>

    <nav class="system-sans-serif mt1 flex flex-wrap color1-bg1 pa0 pa0-m pa0-l fw1 f5 f4-m f3-l">
      <a class="link color1-bg2 color1-hover color1 pa3 pa3-m pa3-l ml2 br3" href="fitness.html">Fit</a>
      <a class="link color1-bg2 color1-hover color1 pa3 pa3-m pa3-l ml2 br3" href="workout-timer2.html">Timer</a>
      <a class="link color1-bg2 color1-hover color1 pa3 pa3-m pa3-l ml2 br3" href="arts.html">Arts</a>
      <a class="link color1-bg2 color1-hover color1 pa3 pa3-m pa3-l ml2 br3" href="nerd.html">Nerd</a>
      <a class="link color1-bg2 color1-hover color1 pa3 pa3-m pa3-l ml2 br3" href="ctc.html">Contact</a>
    </nav>
    `)
  );
}

function setColorTheme() {
  const colorTheme = sessionStorage.getItem('color-theme');
  if (colorTheme == 'light') {
    document.documentElement.setAttribute("theme", "light");
  } else {
    document.documentElement.removeAttribute("theme");
  }
}

// eof
