import React, { useState, useContext, useEffect } from "react";
import {
  TextField,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import formatDate from "../../../utils/formatDate";
import usestyles from "./styles";
import { ExpenseTrackerContext } from "../../../context/context";
import { v4 as uuidv4 } from "uuid";
import {
  incomeCategories,
  expenseCategories,
} from "../../../constants/categories";
import { useSpeechContext } from "@speechly/react-client";
import CustomizedSnackbar from "../../Snackbar/Snackbar";
import { ContactMailSharp } from "@material-ui/icons";
const initialState = {
  amount: "",
  category: "",
  type: "Income",
  date: formatDate(new Date()),
};

const Form = () => {
  const classes = usestyles();
  const [formData, setFormData] = useState(initialState);
  const { segment } = useSpeechContext();
  const { addTransaction } = useContext(ExpenseTrackerContext);

  console.log("segment", segment);
  const [open, setOpen] = useState(false);
  const createTransaction = () => {
    if (Number.isNaN(Number(formData.amount)) || !formData.date.includes("-"))
      return;
    const transaction = {
      ...formData,
      amount: Number(formData.amount),
      id: uuidv4(),
    };
    setOpen(true);
    addTransaction(transaction);
    setFormData(initialState);
  };
  console.log("formData", formData);
  useEffect(() => {
    if (segment) {
      if (segment.intent.intent === "add_expense") {
        setFormData({ ...formData, type: "Expense" });
      } else if (segment.intent.intent === "add_income") {
        setFormData({ ...formData, type: "Income" });
      } else if (
        segment.isFinal &&
        segment.intent.intent === "create_transaction"
      ) {
        return createTransaction();
      } else if (
        segment.isFinal &&
        segment.intent.intent === "cancel_transaction"
      ) {
        return setFormData(initialState);
      }

      segment.entities.forEach((e) => {
        const category = `${e.value.charAt(0)}${e.value
          .slice(1)
          .toLowerCase()}`;
        console.log("category", category);
        console.log("segment values", e.value);
        switch (e.type) {
          case "amount":
            setFormData({ ...formData, amount: e.value });
            break;
          case "category":
            if (incomeCategories.map((ic) => ic.type).includes(category)) {
              setFormData({ ...formData, type: "Income", category });
            } else if (
              expenseCategories.map((ic) => ic.type).includes(category)
            ) {
              setFormData({ ...formData, type: "Expense", category });
            }

            break;
          case "date":
            setFormData({ ...formData, date: e.value });
            break;
          default:
            break;
        }
      });
      if (
        segment.isFinal &&
        formData.amount &&
        formData.category &&
        formData.type &&
        formData.date
      ) {
        createTransaction();
      }
    }
  }, [segment]);

  const selectedcategories =
    formData.type === "Income" ? incomeCategories : expenseCategories;
  return (
    <Grid container spacing={2}>
      <CustomizedSnackbar open={open} setOpen={setOpen} />
      <Grid item xs={12}>
        <Typography align="center" variant="subtitle2" gutterBottom>
          {segment ? <>{segment.words.map((w) => w.value).join(" ")}</> : null}
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <MenuItem value="Income">Income</MenuItem>
            <MenuItem value="Expense">Expense</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            {selectedcategories.map((c) => (
              <MenuItem key={c.type} value={c.type}>
                {c.type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Amount"
          type="number"
          fullWidth
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Date"
          type="date"
          fullWidth
          value={formData.date}
          onChange={(e) =>
            setFormData({ ...formData, date: formatDate(e.target.value) })
          }
        />
      </Grid>
      <Button
        color="primary"
        fullWidth
        variant="outlined"
        className={classes.button}
        onClick={createTransaction}
      >
        Create
      </Button>
    </Grid>
  );
};

export default Form;
