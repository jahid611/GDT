import { useState } from "react";
import emailjs from "@emailjs/browser";

const EmailSender = () => {
    const [to, setTo] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Moyenne");
    const [status, setStatus] = useState("À faire");
    const [deadline, setDeadline] = useState("");
    const [estimatedTime, setEstimatedTime] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [responseMessage, setResponseMessage] = useState(null);

    const sendEmail = (e) => {
        e.preventDefault();
        setResponseMessage("Envoi en cours...");

        const templateParams = {
            to_email: to,
            title: title,
            description: description,
            priority: priority,
            status: status,
            deadline: deadline,
            estimated_time: estimatedTime,
            assigned_to: assignedTo,
        };

        emailjs
            .send("service_jhd", "template_jhd", templateParams, "FiWAOQdkaG34q5-hc")
            .then(() => {
                setResponseMessage("E-mail envoyé avec succès !");
            })
            .catch((error) => {
                setResponseMessage("Erreur lors de l'envoi de l'e-mail : " + error.text);
            });
    };

    return (
        <div>
            <h2>Nouvelle tâche</h2>
            <form onSubmit={sendEmail}>
                <input
                    type="email"
                    placeholder="Adresse e-mail"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Titre"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                ></textarea>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="À faire">À faire</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                </select>
                <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Temps estimé (en heures)"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Assigné à"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    required
                />
                <button type="submit">Envoyer</button>
            </form>
            {responseMessage && <p>{responseMessage}</p>}
        </div>
    );
};

export default EmailSender;
