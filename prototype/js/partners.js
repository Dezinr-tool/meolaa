/* 6.7 Enquiry form — validation, error and success states */

(function initEnquiryForm() {
  const form = document.querySelector("[data-pt-form]");
  if (!form) return;
  const status = form.querySelector("[data-pt-status]");
  const defaultNote = status ? status.textContent : "";

  const recipients = {
    supply: "supply@meolaa.com",
    distribution: "retail@meolaa.com",
    brand: "brands@meolaa.com",
    investment: "investors@meolaa.com",
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll("input, select, textarea")];
    const invalid = fields.filter((f) => f.required && !f.checkValidity());

    fields.forEach((f) => { f.style.borderBottomColor = ""; });

    if (invalid.length) {
      invalid.forEach((f) => { f.style.borderBottomColor = "#b23b3b"; });
      if (status) {
        status.textContent = `Please complete ${invalid.length} required field${invalid.length > 1 ? "s" : ""}.`;
        status.style.color = "#b23b3b";
      }
      invalid[0].focus();
      return;
    }

    const type = form.querySelector("#pt-type").value;
    if (status) {
      status.textContent = `Thanks — your enquiry has been routed to ${recipients[type] || "hello@meolaa.com"}. Confirmation on its way.`;
      status.style.color = "#2d6a4f";
    }
    form.reset();
    setTimeout(() => {
      if (!status) return;
      status.textContent = defaultNote;
      status.style.color = "";
    }, 8000);
  });
})();
