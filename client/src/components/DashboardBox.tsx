import { Box } from "@mui/material";
import { styled } from "@mui/system";

const DashboardBox = styled(Box)(({ theme }) => ({
    textAlign: "center",
    padding: 10,
    backgroundColor: theme.palette.background.light,
    borderRadius: theme.palette.cosmetics.radius,
    borderColor: theme.palette.cosmetics.colorPrimary,
    borderWidth: theme.palette.cosmetics.width,
    borderStyle: theme.palette.cosmetics.borderStyle
}));

export default DashboardBox;

// Styled Material-UI's properties
//   // Background properties
//   backgroundColor: theme.palette.background.light,  // e.g., '#ffffff'

//   // Border properties
//   borderRadius: "1rem",                             // e.g., '1rem', '10px'
//   borderColor: theme.palette.grey[700],             // e.g., '#6b6d74'
//   borderWidth: "1px",                               // e.g., '1px', '2px'
//   borderStyle: 'solid',                             // e.g., 'solid', 'dashed', 'dotted'

//   // Box shadow
//   boxShadow: "0.15rem 0.2rem 0.15rem 0.1rem rgba(0, 0, 0, 0.8)", // e.g., '2px 2px 5px rgba(0,0,0,0.5)'

//   // Dimensions
//   width: '100%',                                    // e.g., '100%', '200px'
//   height: 'auto',                                   // e.g., 'auto', '400px'
//   minWidth: '300px',                                // e.g., '300px', '50%'
//   minHeight: '200px',                               // e.g., '200px', '50%'

//   // Padding and Margin
//   padding: '16px',                                  // e.g., '16px', '1rem'
//   paddingTop: '1rem',                               // e.g., '1rem', '10px'
//   paddingRight: '1rem',                             // e.g., '1rem', '10px'
//   paddingBottom: '1rem',                            // e.g., '1rem', '10px'
//   paddingLeft: '1rem',                              // e.g., '1rem', '10px'
//   margin: '16px',                                   // e.g., '16px', '1rem'

//   // Display properties
//   display: 'flex',                                  // e.g., 'flex', 'block', 'inline-block'
//   flexDirection: 'column',                          // e.g., 'row', 'column'
//   alignItems: 'center',                             // e.g., 'center', 'flex-start', 'flex-end'
//   justifyContent: 'center',                         // e.g., 'center', 'space-between', 'space-around'

//   // Typography properties
//   fontFamily: theme.typography.fontFamily,          // e.g., '"Roboto", "Helvetica", "Arial", sans-serif'
//   fontSize: theme.typography.fontSize,              // e.g., '14px', '1rem'
//   fontWeight: 'bold',                               // e.g., 'bold', 'normal'
//   color: theme.palette.text.primary,                // e.g., '#000000', '#333333'

//   // Positioning properties
//   position: 'relative',                             // e.g., 'relative', 'absolute', 'fixed'
//   top: '10px',                                      // e.g., '10px', '1rem'
//   left: '10px',                                     // e.g., '10px', '1rem'

//   // Overflow properties
//   overflow: 'hidden',                               // e.g., 'hidden', 'scroll', 'auto'
//   overflowX: 'auto',                                // e.g., 'auto', 'scroll', 'hidden'
//   overflowY: 'auto',                                // e.g., 'auto', 'scroll', 'hidden'

//   // Other properties
//   opacity: 0.9,                                     // e.g., 0.5, 1
//   zIndex: 1,                                        // e.g., 1, 100
//   cursor: 'pointer',                                // e.g., 'pointer', 'default'
