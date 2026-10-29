
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

async function getCollection() {
  const client = await clientPromise;
  const db = client.db("employeeDB");
  return db.collection("employees");
}

// GET: Read all employees
export async function GET() {
  try {
    const employees = await getCollection();

    const data = await employees
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      data.map((employee) => ({
        ...employee,
        _id: employee._id.toString(),
      }))
    );
  } catch (error) {
    console.error("GET employees error:", error);

    return NextResponse.json(
      { message: "Unable to fetch employees" },
      { status: 500 }
    );
  }
}

// POST: Create an employee
export async function POST(request) {
  try {
    const body = await request.json();

    const employee = validateEmployee(body);

    if (employee.error) {
      return NextResponse.json(
        { message: employee.error },
        { status: 400 }
      );
    }

    const employees = await getCollection();

    const existing = await employees.findOne({
      email: employee.email,
    });

    if (existing) {
      return NextResponse.json(
        { message: "This email already exists" },
        { status: 409 }
      );
    }

    const newEmployee = {
      ...employee,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await employees.insertOne(newEmployee);

    return NextResponse.json(
      {
        message: "Employee added successfully",
        employee: {
          ...newEmployee,
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST employees error:", error);

    return NextResponse.json(
      { message: "Unable to add employee" },
      { status: 500 }
    );
  }
}

// PUT: Update an employee
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const employee = validateEmployee(body);

    if (employee.error) {
      return NextResponse.json(
        { message: employee.error },
        { status: 400 }
      );
    }

    const employees = await getCollection();
    const objectId = new ObjectId(id);

    const current = await employees.findOne({ _id: objectId });

    if (!current) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    const duplicate = await employees.findOne({
      email: employee.email,
      _id: { $ne: objectId },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Another employee already uses this email" },
        { status: 409 }
      );
    }

    await employees.updateOne(
      { _id: objectId },
      {
        $set: {
          ...employee,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await employees.findOne({ _id: objectId });

    return NextResponse.json({
      message: "Employee updated successfully",
      employee: {
        ...updated,
        _id: updated._id.toString(),
      },
    });
  } catch (error) {
    console.error("PUT employees error:", error);

    return NextResponse.json(
      { message: "Unable to update employee" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an employee
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const employees = await getCollection();

    const result = await employees.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("DELETE employees error:", error);

    return NextResponse.json(
      { message: "Unable to delete employee" },
      { status: 500 }
    );
  }
}

// Validate and normalize employee fields
function validateEmployee(body) {
  const name =
    typeof body.name === "string" ? body.name.trim() : "";

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  const department =
    typeof body.department === "string"
      ? body.department.trim()
      : "";

  const position =
    typeof body.position === "string"
      ? body.position.trim()
      : "";

  if (!name || !email || !department || !position) {
    return { error: "All fields are required" };
  }

  if (
    name.length > 100 ||
    email.length > 254 ||
    department.length > 100 ||
    position.length > 100
  ) {
    return { error: "One or more fields are too long" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address" };
  }

  return { name, email, department, position };
}
