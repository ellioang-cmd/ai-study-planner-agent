
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [assignments, setAssignments] = useState([]);
  const [task, setTask] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hours, setHours] = useState(2);
  const [difficulty, setDifficulty] = useState("Medium");
  const [chatMessage, setChatMessage] = useState("");
const [chatReply, setChatReply] = useState("");
const [chatLoading, setChatLoading] = useState(false);
const [chatError, setChatError] = useState("");

  
const [loaded, setLoaded] = useState(false);

useEffect(() => {
  try {
    const saved = localStorage.getItem("studyAssignments");

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setAssignments(parsed);
      }
    }
  } catch (error) {
    console.error("Could not load assignments:", error);
  }

  setLoaded(true);
}, []);

useEffect(() => {
  if (loaded) {
    localStorage.setItem(
      "studyAssignments",
      JSON.stringify(assignments)
    );
  }
}, [assignments, loaded]);

  
async function askGemini(e) {
  e.preventDefault();

  if (!chatMessage.trim() || chatLoading) return;

  setChatLoading(true);
  setChatError("");
  setChatReply("");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: chatMessage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI request failed.");
    }

    setChatReply(data.reply || "No response received.");
  } catch (error) {
    setChatError(error.message || "Unable to contact Gemini.");
  } finally {
    setChatLoading(false);
  }
}

  function addAssignment(e) {
    e.preventDefault();

    if (!task.trim() || !deadline) return;

    
const newAssignment = {
  id: crypto.randomUUID(),
  name: task.trim(),
  deadline,
  difficulty,
  completed: false,
};

    setAssignments([...assignments, newAssignment]);
    setTask("");
    setDeadline("");
  }

  function toggleComplete(id) {
    setAssignments(assignments.map((item) =>
      item.id === id
        ? { ...item, completed: !item.completed }
        : item
    ));
  }

  
function getStudyPlan() {
  const pending = assignments
    .filter((item) => !item.completed)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  if (pending.length === 0) {
    return ["Add an assignment to generate a study plan."];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = pending.map((item) => {
    const due = new Date(item.deadline + "T00:00:00");
    const daysLeft = Math.round((due - today) / 86400000);

    let priority = "Low";
    let weight = 1;

    if (daysLeft < 0) {
      priority = "Overdue";
      weight = 5;
    } else if (daysLeft <= 2) {
      priority = "High";
      weight = 3;
    } else if (daysLeft <= 5) {
      priority = "Medium";
      weight = 2;
    }
    
const difficultyWeight = {
  Easy: 1,
  Medium: 1.5,
  Hard: 2,
};

weight = weight * (difficultyWeight[item.difficulty] || 1.5);


    return { ...item, daysLeft, priority, weight };
  });

  const totalWeight = tasks.reduce(
    (sum, item) => sum + item.weight, 0
  );

  return tasks.map((item, index) => {
    const studyTime =
      Math.round((hours * item.weight / totalWeight) * 10) / 10;
      
const difficultyLevel = item.difficulty || "Medium";

const explanation =
  `The agent assigned ${item.priority.toLowerCase()} ` +
  `deadline priority because this assignment is ` +
  `${item.daysLeft < 0 ? "overdue" : "due in " + item.daysLeft + " day(s)"}. ` +
  `Its ${difficultyLevel.toLowerCase()} difficulty also ` +
  `affects the recommended study time.`;


    const deadlineText = item.daysLeft < 0
      ? `${Math.abs(item.daysLeft)} day(s) overdue`
      : item.daysLeft === 0
        ? "Due today"
        : `Due in ${item.daysLeft} day(s)`;

    
    return `${index + 1}. ${item.name}
    Priority: ${item.priority}
    Difficulty: ${difficultyLevel}
    Recommended study time: ${studyTime} hour(s)
    Deadline: ${deadlineText}
    Agent Explanation: ${explanation}`;

     });
    }

    
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-cyan-400">
            AI Study Planner Agent
          </h1>
          <p className="mt-3 text-slate-300">
            Organize assignments, track deadlines, and generate
            personalized study recommendations.
          </p>
          <p className="mt-2 text-sm text-emerald-400">
           Powered by Google Gemini AI
          </p>
        </header>

        <section className="rounded-2xl bg-slate-900 p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-5">
            Add Assignment
          </h2>

          <form onSubmit={addAssignment} className="space-y-4">
            <input
              className="w-full rounded-lg bg-slate-800 p-3"
              placeholder="Assignment name"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
            />
              
            <div>
            <label className="mb-2 block text-sm text-slate-300">
            Assignment Difficulty
          </label>

           <select
           value={difficulty}
           onChange={(e) => setDifficulty(e.target.value)}
           className="w-full rounded-lg bg-slate-800 p-3 text-white"
            >
           <option value="Easy">Easy</option>
           <option value="Medium">Medium</option>
           <option value="Hard">Hard</option>
           </select>
            </div>

            <input
              type="date"
              className="w-full rounded-lg bg-slate-800 p-3"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />

            <button
              type="submit"
              className="rounded-lg bg-cyan-500 px-6 py-3 font-bold text-slate-950"
            >
              Add Assignment
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-slate-900 p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            My Assignments
          </h2>

          {assignments.length === 0 ? (
            <p className="text-slate-400">No assignments yet.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg bg-slate-800 p-4"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleComplete(item.id)}
                  />
                  <div>
                    <p className={item.completed ? "line-through" : ""}>
                      {item.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      Due: {item.deadline}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Agent Study Recommendations
          </h2>

          <label className="block mb-2">
            Available study hours today
          </label>

          <input
            type="number"
            min="1"
            max="24"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="rounded-lg bg-slate-800 p-3 mb-5"
          />

          <div className="space-y-3">
            {getStudyPlan().map((recommendation, index) => (
              
          <div
           key={index}
          className="whitespace-pre-line rounded-lg border border-cyan-800 bg-slate-800 p-4 leading-7"
>
           {recommendation}
          </div>

            ))}
          </div>
        </section>
        
<section className="mt-8 rounded-2xl bg-slate-900 p-6">
  <h2 className="mb-4 text-2xl font-semibold text-cyan-400">
    Ask Gemini AI Study Assistant
  </h2>

  <p className="mb-4 text-slate-300">
    Ask questions about studying, assignments, exams,
    or time management.
  </p>

  <form onSubmit={askGemini} className="space-y-4">
    <textarea
      value={chatMessage}
      onChange={(e) => setChatMessage(e.target.value)}
      placeholder="Example: Create a study plan for my cybersecurity exam."
      className="w-full rounded-lg bg-slate-800 p-3 text-white"
      rows={4}
      required
    />

    <button
      type="submit"
      disabled={chatLoading}
      className="rounded-lg bg-cyan-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-50"
    >
      {chatLoading ? "Gemini is thinking..." : "Ask Gemini AI"}
    </button>
  </form>

  {chatError && (
    <p className="mt-4 text-red-400">{chatError}</p>
  )}

  {chatReply && (
    <div className="mt-6 whitespace-pre-wrap rounded-lg bg-slate-800 p-4 leading-7">
      <h3 className="mb-3 font-semibold text-emerald-400">
        Gemini AI Response
      </h3>
      {chatReply}
    </div>
  )}
</section>

      </div>
    </main>
  );
}
