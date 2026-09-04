package project.collegeplacement.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import project.collegeplacement.entity.Application;
import project.collegeplacement.entity.Student;

@Service
@RequiredArgsConstructor
public class MailService {

    private static final Logger logger = LoggerFactory.getLogger(MailService.class);
    private static final String SUBJECT = "Welcome to College Placement Management System";

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendRegistrationEmail(Student student) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }

            helper.setTo(student.getEmail());
            helper.setSubject(SUBJECT);
            helper.setText(buildRegistrationEmail(student), true);

            javaMailSender.send(message);
            logger.info("Email sent successfully to: {}", student.getEmail());
        } catch (Exception exception) {
            logger.error("Failed to send email.", exception);
        }
    }

    public void sendApplicationStatusEmail(Application application) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }

            helper.setTo(application.getStudentEmail());
            helper.setSubject(getApplicationStatusSubject(application.getStatus()));
            helper.setText(buildApplicationStatusEmail(application), false);

            javaMailSender.send(message);
            logger.info("Application status email sent successfully to: {}", application.getStudentEmail());
        } catch (Exception exception) {
            logger.error("Failed to send application status email.", exception);
            throw new RuntimeException("Failed to send application status email");
        }
    }

    private String buildRegistrationEmail(Student student) throws MessagingException {
        String name = escape(student.getName());
        String email = escape(student.getEmail());
        String department = escape(student.getDepartment());
        String cgpa = student.getCgpa() == null ? "-" : escape(String.valueOf(student.getCgpa()));

        return """
                <!doctype html>
                <html>
                <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:28px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                          <tr>
                            <td style="background:#0f172a;padding:24px 28px;color:#ffffff;">
                              <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#a7f3d0;">Placement Cell</div>
                              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;">Welcome to College Placement Management System</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:22px 28px 0;">
                              <div style="background:#dcfce7;border:1px solid #86efac;color:#166534;border-radius:6px;padding:14px 16px;font-weight:700;">
                                Registration completed successfully
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 28px;">
                              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hello %s,</p>
                              <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">Your registration has been completed successfully.</p>

                              <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">Student Details</h2>
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                                <tr>
                                  <td style="padding:12px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:700;width:36%%;">Name</td>
                                  <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:700;">Email</td>
                                  <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:700;">Department</td>
                                  <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 14px;background:#f9fafb;font-weight:700;">CGPA</td>
                                  <td style="padding:12px 14px;">%s</td>
                                </tr>
                              </table>

                              <p style="margin:24px 0 12px;font-size:15px;line-height:1.6;">You can now log in to the College Placement Portal and:</p>
                              <ul style="margin:0 0 24px 20px;padding:0;font-size:15px;line-height:1.8;">
                                <li>Upload Resume</li>
                                <li>Apply for Campus Drives</li>
                                <li>Search External Jobs</li>
                                <li>Track Applications</li>
                              </ul>

                              <a href="http://localhost:8080" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;font-weight:700;">Open Placement Portal</a>

                              <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">We wish you all the best for your placements.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 28px;color:#4b5563;font-size:13px;line-height:1.6;">
                              Regards,<br>
                              Placement Cell<br>
                              College Placement Management System
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(name, name, email, department, cgpa);
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null || value.isBlank() ? "-" : value);
    }

    private String getApplicationStatusSubject(String status) {
        return switch (normalizeStatus(status)) {
            case "APPLIED" -> "Application Received";
            case "SHORTLISTED" -> "Congratulations! You are Shortlisted";
            case "SELECTED" -> "Congratulations! You are Selected";
            case "REJECTED" -> "Application Update";
            default -> "Application Update";
        };
    }

    private String buildApplicationStatusEmail(Application application) {
        String studentName = plain(application.getStudentName());
        String jobRole = plain(application.getJobRole());
        String companyName = plain(application.getCompanyName());

        return switch (normalizeStatus(application.getStatus())) {
            case "APPLIED" -> """
                    Hello %s,

                    Your application for the role of %s at %s has been received successfully.

                    Current Status:
                    APPLIED

                    We will review your application and update you soon.

                    Regards,
                    Placement Cell
                    """.formatted(studentName, jobRole, companyName);
            case "SHORTLISTED" -> """
                    Hello %s,

                    Congratulations!

                    You have been shortlisted for the role of %s at %s.

                    Please wait for further instructions regarding the next round.

                    Regards,
                    Placement Cell
                    """.formatted(studentName, jobRole, companyName);
            case "SELECTED" -> """
                    Hello %s,

                    Congratulations!

                    We are happy to inform you that you have been SELECTED for the role of %s at %s.

                    Our Placement Cell will contact you with the next steps.

                    We wish you a successful career.

                    Regards,
                    Placement Cell
                    """.formatted(studentName, jobRole, companyName);
            case "REJECTED" -> """
                    Hello %s,

                    Thank you for applying for the role of %s at %s.

                    After careful consideration, we regret to inform you that you have not been selected for this opportunity.

                    We encourage you to continue applying for future campus drives.

                    We wish you all the best.

                    Regards,
                    Placement Cell
                    """.formatted(studentName, jobRole, companyName);
            default -> throw new RuntimeException("Invalid application status");
        };
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase();
    }

    private String plain(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }
}
