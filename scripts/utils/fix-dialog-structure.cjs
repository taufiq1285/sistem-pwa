const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Dialog structure errors...\n');

// ============================================================================
// Fix UsersPage.tsx
// ============================================================================

const usersPath = path.join(__dirname, 'src/pages/admin/UsersPage.tsx');
let usersContent = fs.readFileSync(usersPath, 'utf8');

// Remove the extra closing div before Dialog
usersContent = usersContent.replace(
  `        </CardContent>
      </Card>
    </div>

      {/* Edit User Dialog */}`,
  `        </CardContent>
      </Card>

      {/* Edit User Dialog */}`
);

// Fix the closing - only one closing div after Dialog
usersContent = usersContent.replace(
  `        </DialogContent>
      </Dialog>
    </div>
  );
}`,
  `        </DialogContent>
      </Dialog>
    </div>
  );
}`
);

fs.writeFileSync(usersPath, usersContent, 'utf8');
console.log('✅ Fixed UsersPage.tsx structure');

// ============================================================================
// Fix LaboratoriesPage.tsx
// ============================================================================

const labsPath = path.join(__dirname, 'src/pages/admin/LaboratoriesPage.tsx');
let labsContent = fs.readFileSync(labsPath, 'utf8');

// Remove the extra closing div before Dialog
labsContent = labsContent.replace(
  `        </CardContent>
      </Card>
    </div>

      {/* Edit Laboratory Dialog */}`,
  `        </CardContent>
      </Card>

      {/* Edit Laboratory Dialog */}`
);

// Fix the closing - only one closing div after Dialog
labsContent = labsContent.replace(
  `        </DialogContent>
      </Dialog>
    </div>
  );
}`,
  `        </DialogContent>
      </Dialog>
    </div>
  );
}`
);

fs.writeFileSync(labsPath, labsContent, 'utf8');
console.log('✅ Fixed LaboratoriesPage.tsx structure');

console.log('\n═══════════════════════════════════════');
console.log('✅ Dialog structure errors fixed!');
console.log('═══════════════════════════════════════');
console.log('\nFixed issues:');
console.log('  - Removed duplicate closing </div> tags');
console.log('  - Dialog now properly inside return statement');
console.log('  - Proper JSX structure');
